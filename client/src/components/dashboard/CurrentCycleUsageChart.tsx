import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Transform user word usage data into a chart-friendly format for a specific billing cycle
function prepareUsageDataByCycle(usageHistory, cycleNumber) {
  if (!usageHistory || !Array.isArray(usageHistory) || usageHistory.length === 0) {
    return { chartData: [], cycleDateRange: { start: null, end: null }, totalWords: 0 };
  }

  // Filter entries with the specified cycle number
  const cycleEntries = usageHistory.filter(entry => 
    entry.cycleNumber === cycleNumber
  );
  
  if (cycleEntries.length === 0) {
    return { chartData: [], cycleDateRange: { start: null, end: null }, totalWords: 0 };
  }

  // Get date range for this cycle
  const cycleDateRange = {
    start: cycleEntries[0].cycleStartDate,
    end: cycleEntries[0].cycleEndDate
  };

  // Sort entries by creation date
  const sortedEntries = [...cycleEntries].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Calculate total words for this cycle
  const totalWords = sortedEntries.reduce((sum, entry) => sum + entry.wordCount, 0);

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
      timestamp: entryDate.getTime(), // Used for tooltip custom sorting
      rawDate: entry.createdAt // Keep the original date
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
          latestTimestamp: item.timestamp,
          rawDate: item.rawDate
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
    const finalChartData = consolidatedData.map(item => {
      runningSum += item.words;
      return {
        date: item.date,
        words: item.words,
        runningTotal: runningSum,
        entries: item.entries,
        rawDate: item.rawDate
      };
    });

    return {
      chartData: finalChartData,
      cycleDateRange,
      totalWords
    };
  }

  return {
    chartData,
    cycleDateRange,
    totalWords
  };
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
  
  // State for keeping track of which cycle we're viewing
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);
  const [cycleData, setCycleData] = useState({
    chartData: [],
    cycleDateRange: { start: null, end: null },
    totalWords: 0,
    availableCycles: []
  });

  // When data is loaded, process it to find all available cycles
  useEffect(() => {
    if (!data || !data.history || !Array.isArray(data.history) || data.history.length === 0) {
      return;
    }

    // Get unique cycle numbers
    const uniqueCycles = [...new Set(data.history.map(entry => entry.cycleNumber))];
    
    // Sort in descending order (newest first)
    const sortedCycles = uniqueCycles.sort((a, b) => b - a);
    
    // Select the current (latest) cycle by default
    const currentCycleNumber = sortedCycles[selectedCycleIndex];
    
    // Process the data for the selected cycle
    const processedData = prepareUsageDataByCycle(data.history, currentCycleNumber);
    
    setCycleData({
      ...processedData,
      availableCycles: sortedCycles
    });
  }, [data, selectedCycleIndex]);

  if (isLoading) {
    return <CurrentCycleUsageChartSkeleton />;
  }

  const { chartData, cycleDateRange, totalWords, availableCycles } = cycleData;
  const wordLimit = data?.subscriptionPlan?.monthlyWordLimit || 1000;
  
  // Navigation controls
  const hasPreviousCycle = selectedCycleIndex < availableCycles.length - 1;
  const hasNextCycle = selectedCycleIndex > 0;
  
  const navigateToPreviousCycle = () => {
    if (hasPreviousCycle) {
      setSelectedCycleIndex(selectedCycleIndex + 1);
    }
  };
  
  const navigateToNextCycle = () => {
    if (hasNextCycle) {
      setSelectedCycleIndex(selectedCycleIndex - 1);
    }
  };

  // Format dates for display
  let formattedStartDate = 'N/A';
  let formattedEndDate = 'N/A';
  
  if (cycleDateRange.start && cycleDateRange.end) {
    const startDate = new Date(cycleDateRange.start);
    const endDate = new Date(cycleDateRange.end);
    formattedStartDate = format(startDate, 'MMM d, yyyy');
    formattedEndDate = format(endDate, 'MMM d, yyyy');
  }

  // Calculate usage percentage for this cycle
  const usagePercentage = Math.min(100, Math.round((totalWords / wordLimit) * 100));

  // Custom colors for the bars
  const getBarColor = (entry) => {
    const percentage = (entry.runningTotal / wordLimit) * 100;
    if (percentage > 90) return "var(--destructive)";
    if (percentage > 70) return "var(--warning)";
    return "var(--primary)";
  };

  // Determine if we're showing the current cycle
  const isCurrentCycle = selectedCycleIndex === 0;
  const cycleTitle = isCurrentCycle 
    ? "Current Billing Cycle Usage" 
    : `Previous Billing Cycle (${formattedStartDate.split(',')[0]})`;

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{cycleTitle}</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-muted-foreground">
            {formattedStartDate} - {formattedEndDate}
          </div>
          {availableCycles.length > 1 && (
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={navigateToPreviousCycle}
                disabled={!hasPreviousCycle}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={navigateToNextCycle}
                disabled={!hasNextCycle}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
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
                Used {totalWords.toLocaleString()} of {wordLimit.toLocaleString()} words ({usagePercentage}%)
                in this billing cycle
              </span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p>No usage data available for this billing cycle</p>
            <p className="text-sm mt-2">Try selecting a different billing cycle or start recording conversations</p>
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