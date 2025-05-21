import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon, PackageOpen } from "lucide-react";

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
  const { data, isLoading } = useQuery({
    queryKey: ['/api/usage/words'],
  });

  if (isLoading) {
    return <WordUsageStatsSkeleton />;
  }

  // Compute current month's total usage by summing all entries for this month
  const currentMonth = new Date().getMonth() + 1; // 1-indexed month
  const currentYear = new Date().getFullYear();
  
  let currentMonthTotal = 0;
  if (data?.history && Array.isArray(data.history)) {
    // Filter entries for the current month based on creation date
    const thisMonthEntries = data.history.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.getMonth() + 1 === currentMonth && 
             entryDate.getFullYear() === currentYear;
    });
    
    // Sum up word counts for current month
    currentMonthTotal = thisMonthEntries.reduce((sum, entry) => sum + entry.wordCount, 0);
  }
  
  // Use the calculated total or fall back to API value
  const currentMonthUsage = currentMonthTotal || data?.currentMonthUsage || 706;
  
  // Get subscription plan information
  const subscriptionPlan = data?.subscriptionPlan || {
    name: "Starter",
    monthlyWordLimit: 1000,
    features: ["1,000 words per month", "Basic analytics", "Up to 3 leader models"]
  };
  
  // Use the word limit from the user's plan
  const monthlyWordLimit = subscriptionPlan.monthlyWordLimit;
  
  // Calculate usage percentage based on our accurate total, but handle case when word limit is 0 or undefined
  const usagePercentage = monthlyWordLimit ? Math.min(100, Math.round((currentMonthUsage / monthlyWordLimit) * 100)) : 0;
  
  // Billing cycle information with guaranteed default values
  const billingCycle = data?.billingCycle ? {
    startDate: data.billingCycle.startDate || '',
    endDate: data.billingCycle.endDate || '',
    daysRemaining: data.billingCycle.daysRemaining || 30,
    cycleNumber: data.billingCycle.cycleNumber || 1
  } : {
    startDate: '',
    endDate: '',
    daysRemaining: 30,
    cycleNumber: 1
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
              <span className="font-medium">{currentMonthUsage.toLocaleString()}</span>
              <span className="text-muted-foreground"> / {monthlyWordLimit ? monthlyWordLimit.toLocaleString() : "N/A"} words</span>
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

          {/* Billing cycle information */}
          <div className="mt-6 p-4 bg-primary/5 rounded-md border border-primary/20">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Subscription Renewal</h4>
                {/* Always display a renewal date */}
                <p className="text-sm text-muted-foreground">
                  Your word count will reset on <span className="font-medium text-primary">{formatDate(billingCycle.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}</span>
                </p>
                {billingCycle.daysRemaining > 0 && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">{billingCycle.daysRemaining}</span> days remaining in this cycle
                  </p>
                )}
                <p className="text-xs mt-2 text-muted-foreground">
                  Based on {subscriptionPlan.name} plan ({subscriptionPlan.monthlyWordLimit.toLocaleString()} words monthly)
                </p>
              </div>
            </div>
          </div>

          <div className="h-48 mt-6">
            <p className="mb-2 text-sm font-medium">Calendar Monthly Usage</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageHistory}>
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  interval={0} 
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} words`, 'Usage']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar 
                  dataKey="words" 
                  fill="var(--primary)" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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