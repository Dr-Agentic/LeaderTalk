import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CalendarIcon, PackageOpen, TrendingUp } from "lucide-react";

// Generate a data structure for the past 6 months
function generatePast6MonthsData(history: any[]) {
  const today = new Date("2025-05-17"); // Use the current date (May 17, 2025)
  const months = [];
  const data = [];
  
  // Generate the past 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'short' });
    const yearShort = String(year).slice(2);
    
    months.push({ 
      month, 
      year,
      label: `${monthName} ${yearShort}`
    });
  }
  
  // Create a map to aggregate word counts by month and year
  const monthlyUsage = new Map();
  
  // Initialize all months with zero
  months.forEach(month => {
    const key = `${month.year}-${month.month}`;
    monthlyUsage.set(key, 0);
  });
  
  // Aggregate actual usage data
  if (history && Array.isArray(history)) {
    history.forEach(item => {
      // Extract year and month from displayName or directly from data
      const year = item.year || parseInt(item.displayName?.split(' ')[1] || '2025');
      const monthStr = item.displayName?.split(' ')[0] || '';
      const monthNumber = item.month || getMonthNumber(monthStr);
      
      const key = `${year}-${monthNumber}`;
      if (monthlyUsage.has(key)) {
        monthlyUsage.set(key, monthlyUsage.get(key) + (item.wordCount || 0));
      }
    });
  }
  
  // Convert aggregated data to chart format
  months.forEach(month => {
    const key = `${month.year}-${month.month}`;
    data.push({
      name: month.label,
      words: monthlyUsage.get(key) || 0
    });
  });
  
  console.log("Generated chart data:", data);
  return data;
}

// Helper function to convert month name to number
function getMonthNumber(monthStr: string): number {
  const months = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
    'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
    'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return months[monthStr as keyof typeof months] || 0;
}

// Format a date string like '2023-04-15' to 'Apr 15, 2023'
function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString; // Return the original string if parsing fails
  }
}

export default function WordUsageStats() {
  // Use the new billing cycle endpoint for accurate calculations
  const { data, isLoading } = useQuery({
    queryKey: ['/api/usage/billing-cycle'],
  });

  // Get recordings data for the chart
  const { data: recordingsData, isLoading: isRecordingsLoading } = useQuery({
    queryKey: ['/api/recordings'],
  });

  if (isLoading) {
    return <WordUsageStatsSkeleton />;
  }

  // Get billing cycle data directly from server (no client-side calculations needed)
  const currentBillingCycleUsage = data?.currentUsage || 0;
  const wordLimit = data?.wordLimit || 0;
  const usagePercentage = data?.usagePercentage || 0;
  const hasExceededLimit = data?.hasExceededLimit || false;
  
  // Get billing cycle information from server
  const billingCycle = data?.billingCycle || {
    startDate: undefined,
    endDate: undefined,
    daysRemaining: 0
  };
  
  // For backward compatibility with existing UI, create a subscription plan object
  const subscriptionPlan = {
    name: "Starter", // We'll get this from Stripe data later
    monthlyWordLimit: wordLimit,
    features: []
  };

  // Generate history data for the past 6 months
  const usageHistory = generatePast6MonthsData(data?.history || []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="w-full">
          Word Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <PackageOpen className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">{subscriptionPlan.name} Plan</span>
            </div>
            <div className="text-right">
              <span className="font-medium">{currentBillingCycleUsage.toLocaleString()}</span>
              <span className="text-muted-foreground"> / {wordLimit ? wordLimit.toLocaleString() : "N/A"} words</span>
            </div>
          </div>
          
          <div>
            <Progress 
              value={usagePercentage} 
              className="h-3" 
              // Change color based on usage percentage
              color={usagePercentage > 90 ? "destructive" : undefined}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {usagePercentage}% of your monthly word allocation used
            </p>
          </div>



          {/* Billing Cycle Recordings Chart */}
          {!isRecordingsLoading && data?.history && (
            <div className="h-48 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Billing Cycle Recordings</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentMonthData.chartData}>
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value.toLocaleString()} words`,
                      'Words Used'
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return `${payload[0].payload.recordingName || `Day ${label}`}`;
                      }
                      return `Day ${label}`;
                    }}
                  />
                  <Bar 
                    dataKey="words" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={currentMonthData.chartData.length > 20 ? 20 : 40}
                  >
                    {currentMonthData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="var(--primary)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WordUsageStatsSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full mt-6" />
        </div>
      </CardContent>
    </Card>
  );
}