import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Info, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format, parseISO, setMonth, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Group usage data by month
function prepareMonthlyUsageData(usageHistory) {
  if (!usageHistory || !Array.isArray(usageHistory) || usageHistory.length === 0) {
    return [];
  }

  // Map to store monthly totals
  const monthlyTotals = new Map();
  
  // Process each entry
  usageHistory.forEach(entry => {
    const entryDate = new Date(entry.createdAt);
    const monthKey = format(entryDate, 'yyyy-MM'); // e.g. "2025-05"
    const monthDisplay = format(entryDate, 'MMM yyyy'); // e.g. "May 2025"
    
    if (!monthlyTotals.has(monthKey)) {
      monthlyTotals.set(monthKey, { 
        monthKey, 
        monthDisplay, 
        words: 0,
        sortDate: entryDate,
        entries: 0
      });
    }
    
    const monthData = monthlyTotals.get(monthKey);
    monthData.words += entry.wordCount;
    monthData.entries += 1;
    
    monthlyTotals.set(monthKey, monthData);
  });
  
  // Convert map to array and sort by date (newest first)
  return Array.from(monthlyTotals.values())
    .sort((a, b) => b.sortDate - a.sortDate);
}

// For the billing cycle view
function prepareUsageDataByCycle(usageHistory, yearMonth) {
  if (!usageHistory || !Array.isArray(usageHistory) || usageHistory.length === 0) {
    return { chartData: [], monthYear: null, totalWords: 0 };
  }

  // Parse the year-month
  const [year, month] = yearMonth.split('-').map(n => parseInt(n, 10));
  const monthStart = startOfMonth(new Date(year, month - 1)); // 0-indexed month
  const monthEnd = endOfMonth(monthStart);

  // Filter entries within the specified month
  const monthEntries = usageHistory.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= monthStart && entryDate <= monthEnd;
  });
  
  if (monthEntries.length === 0) {
    return { 
      chartData: [], 
      monthYear: format(monthStart, 'MMMM yyyy'), 
      dateRange: { start: monthStart, end: monthEnd },
      totalWords: 0 
    };
  }

  // Sort entries by creation date
  const sortedEntries = [...monthEntries].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Calculate total words for this month
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
      rawDate: entry.createdAt, // Keep the original date
      fullDate: format(entryDate, 'MMMM d, yyyy')
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
          rawDate: item.rawDate,
          fullDate: item.fullDate
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
        rawDate: item.rawDate,
        fullDate: item.fullDate
      };
    });

    return {
      chartData: finalChartData,
      monthYear: format(monthStart, 'MMMM yyyy'),
      dateRange: { start: monthStart, end: monthEnd },
      totalWords
    };
  }

  return {
    chartData,
    monthYear: format(monthStart, 'MMMM yyyy'),
    dateRange: { start: monthStart, end: monthEnd },
    totalWords
  };
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-3 text-sm">
        <p className="font-medium">{payload[0].payload.fullDate || label}</p>
        <p className="text-primary">
          Words recorded: {payload[0].payload.words.toLocaleString()}
        </p>
        <p className="text-muted-foreground">
          Total this month: {payload[0].payload.runningTotal?.toLocaleString() || payload[0].payload.words.toLocaleString()} words
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
  
  // State for the month we're viewing (format: 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [monthlyData, setMonthlyData] = useState({
    allMonths: [], // Available months with data
    currentMonthData: {
      chartData: [],
      monthYear: '',
      dateRange: { start: null, end: null },
      totalWords: 0
    }
  });

  // Process the data to get monthly usage and details for the selected month
  useEffect(() => {
    if (!data || !data.history || !Array.isArray(data.history)) {
      return;
    }

    // Get monthly totals
    const monthlyTotals = prepareMonthlyUsageData(data.history);
    
    // Make sure we have at least 6 months of data for display
    const sixMonths = [];
    const today = new Date();
    
    // Add the current month and 5 previous months
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthYear = format(monthDate, 'MMM yyyy');
      
      // Check if we already have data for this month
      const existingMonth = monthlyTotals.find(m => m.monthKey === monthKey);
      
      if (existingMonth) {
        sixMonths.push(existingMonth);
      } else {
        // Add empty month
        sixMonths.push({
          monthKey,
          monthDisplay: monthYear,
          words: 0,
          sortDate: monthDate,
          entries: 0
        });
      }
    }
    
    // Sort months by date (newest first)
    const sortedMonths = sixMonths.sort((a, b) => b.sortDate - a.sortDate);
    
    // Get data for the selected month
    const currentMonthData = prepareUsageDataByCycle(data.history, selectedMonth);
    
    setMonthlyData({
      allMonths: sortedMonths,
      currentMonthData
    });
  }, [data, selectedMonth]);

  if (isLoading) {
    return <CurrentCycleUsageChartSkeleton />;
  }

  const { allMonths, currentMonthData } = monthlyData;
  const { chartData, monthYear, dateRange, totalWords } = currentMonthData;
  
  const wordLimit = data?.subscriptionPlan?.monthlyWordLimit || 1000;
  
  // Navigation controls
  const currentMonthIndex = allMonths.findIndex(m => m.monthKey === selectedMonth);
  const hasPreviousMonth = currentMonthIndex < allMonths.length - 1;
  const hasNextMonth = currentMonthIndex > 0;
  
  const navigateToPreviousMonth = () => {
    if (hasPreviousMonth) {
      setSelectedMonth(allMonths[currentMonthIndex + 1].monthKey);
    }
  };
  
  const navigateToNextMonth = () => {
    if (hasNextMonth) {
      setSelectedMonth(allMonths[currentMonthIndex - 1].monthKey);
    }
  };

  // Format dates for display
  let formattedDateRange = '';
  if (dateRange?.start && dateRange?.end) {
    formattedDateRange = `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  }

  // Calculate usage percentage for this month
  const usagePercentage = Math.min(100, Math.round((totalWords / wordLimit) * 100));

  // Custom colors for the bars
  const getBarColor = (entry) => {
    if (!entry.runningTotal) return "var(--primary)";
    
    const percentage = (entry.runningTotal / wordLimit) * 100;
    if (percentage > 90) return "var(--destructive)";
    if (percentage > 70) return "var(--warning)";
    return "var(--primary)";
  };

  // Check if this is the current month
  const isCurrentMonth = selectedMonth === format(new Date(), 'yyyy-MM');

  // Calculate the maximum value for Y-axis to create a consistent scale
  const maxWordCount = chartData.length > 0 
    ? Math.max(...chartData.map(entry => entry.words)) 
    : 0;
  const yAxisMax = Math.ceil(maxWordCount * 1.2); // Add 20% for better visualization

  return (
    <Card className="mb-6">
      <CardHeader className="pb-1">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-2xl font-bold">Billing Cycle Recordings</CardTitle>
          {chartData.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {totalWords.toLocaleString()} words recorded in your billing cycle ({formattedDateRange})
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 bg-muted/50 rounded-md px-3 py-1.5">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="font-medium">Billing Period {data?.billingCycle?.cycleNumber || 1}</span>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={navigateToPreviousMonth}
                disabled={!hasPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={navigateToNextMonth}
                disabled={!hasNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                barSize={40}
              >
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  angle={0}
                  textAnchor="middle"
                  height={50}
                  interval={0}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  fontSize={12}
                  tickFormatter={(value) => value === 0 ? '0' : value.toLocaleString()}
                  domain={[0, yAxisMax > 0 ? yAxisMax : 600]}
                  allowDecimals={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Bar 
                  dataKey="words" 
                  name="Words Used"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry)} 
                      stroke="var(--border)"
                      strokeWidth={0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-1 flex items-center justify-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-2" />
              <span>
                {chartData.length > 0 ? `Showing ${chartData.length} recording session${chartData.length !== 1 ? 's' : ''} for ${monthYear}` : `No recordings in ${monthYear}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p>No usage data available for {monthYear}</p>
            <p className="text-sm mt-2">
              {isCurrentMonth 
                ? "Start recording conversations to see your usage" 
                : "Try selecting a different month"}
            </p>
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
          <Skeleton className="h-6 w-64" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}