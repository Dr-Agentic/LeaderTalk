import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Info } from "lucide-react";
import { format } from "date-fns";

// Transform user word usage data into a chart-friendly format
// This specifically focuses on usage in the current billing cycle
function prepareCurrentCycleData(usageHistory) {
  if (!usageHistory || !Array.isArray(usageHistory) || usageHistory.length === 0) {
    return [];
  }

  // Get all entries for the current billing period (they should all have the same cycleNumber)
  // First, find the latest cycle number
  const latestCycleNumber = Math.max(...usageHistory.map(entry => entry.cycleNumber || 0));
  
  // Then filter entries with that cycle number
  const currentCycleEntries = usageHistory.filter(entry => 
    entry.cycleNumber === latestCycleNumber
  );

  // Sort entries by creation date
  const sortedEntries = [...currentCycleEntries].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Transform to chart data format with running total
  const chartData = sortedEntries.map((entry, index) => {
    const entryDate = new Date(entry.createdAt);
    const formattedDate = format(entryDate, 'MMM d');
    
    // Calculate running total by summing up to this point
    const runningTotal = sortedEntries
      .slice(0, index + 1)
      .reduce((sum, e) => sum + e.wordCount, 0);
    
    return {
      date: formattedDate,
      words: entry.wordCount,
      runningTotal: runningTotal,
      timestamp: entryDate.getTime() // Used for tooltip custom sorting
    };
  });

  // If we have more than 10 entries, consolidate to avoid overcrowding
  if (chartData.length > 10) {
    // Group by date (day)
    const groupedByDay = chartData.reduce((acc, item) => {
      const key = item.date;
      if (!acc[key]) {
        acc[key] = {
          date: key,
          words: 0,
          entries: 0,
          latestTimestamp: item.timestamp
        };
      }
      acc[key].words += item.words;
      acc[key].entries += 1;
      acc[key].latestTimestamp = Math.max(acc[key].latestTimestamp, item.timestamp);
      return acc;
    }, {});

    // Convert back to array and sort by timestamp
    const consolidatedData = Object.values(groupedByDay)
      .sort((a, b) => a.latestTimestamp - b.latestTimestamp);

    // Calculate running totals for consolidated data
    let runningSum = 0;
    return consolidatedData.map(item => {
      runningSum += item.words;
      return {
        date: item.date,
        words: item.words,
        runningTotal: runningSum,
        entries: item.entries
      };
    });
  }

  return chartData;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-primary">
          Words this session: {payload[0].payload.words.toLocaleString()}
        </p>
        <p className="text-muted-foreground">
          Total used: {payload[0].payload.runningTotal.toLocaleString()} words
        </p>
        {payload[0].payload.entries > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Combined from {payload[0].payload.entries} recordings
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function CurrentCycleUsageChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/usage/words'],
  });

  if (isLoading) {
    return <CurrentCycleUsageChartSkeleton />;
  }

  const chartData = prepareCurrentCycleData(data?.history || []);
  const currentMonthUsage = data?.currentMonthUsage || 0;
  const wordLimit = data?.subscriptionPlan?.monthlyWordLimit || 1000;
  const billingCycle = data?.billingCycle || { 
    startDate: '', 
    endDate: '',
    daysRemaining: 30 
  };

  // Format dates for display
  const startDate = billingCycle.startDate ? new Date(billingCycle.startDate) : new Date();
  const endDate = billingCycle.endDate ? new Date(billingCycle.endDate) : new Date();
  
  const formattedStartDate = format(startDate, 'MMM d, yyyy');
  const formattedEndDate = format(endDate, 'MMM d, yyyy');

  // Custom colors for the bars
  const getBarColor = (entry) => {
    const percentage = (entry.runningTotal / wordLimit) * 100;
    if (percentage > 90) return "var(--destructive)";
    if (percentage > 70) return "var(--warning)";
    return "var(--primary)";
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Current Billing Cycle Usage</CardTitle>
        <div className="text-sm text-muted-foreground">
          {formattedStartDate} - {formattedEndDate}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  fontSize={12}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="words" name="Words Used">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-2" />
              <span>
                Used {currentMonthUsage.toLocaleString()} of {wordLimit.toLocaleString()} words ({Math.round((currentMonthUsage / wordLimit) * 100)}%)
                in this billing cycle
              </span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p>No usage data available for current billing cycle</p>
            <p className="text-sm mt-2">Start recording conversations to see your usage</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CurrentCycleUsageChartSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}