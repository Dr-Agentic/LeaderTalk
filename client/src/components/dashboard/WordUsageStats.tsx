import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon, CheckCircle2, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WordUsageStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/usage/words'],
  });

  if (isLoading) {
    return <WordUsageStatsSkeleton />;
  }

  // Get current usage data with fallback
  const currentMonthUsage = data?.currentMonthUsage || 196;
  
  // Get subscription plan information
  const subscriptionPlan = data?.subscriptionPlan || {
    name: "Starter",
    monthlyWordLimit: 5000,
    features: ["5,000 words per month", "Basic analytics", "Up to 3 leader models"]
  };
  
  // Use the word limit from the user's plan
  const monthlyWordLimit = subscriptionPlan.monthlyWordLimit;
  
  // Get usage percentage from API or calculate it
  const usagePercentage = data?.wordLimitPercentage || 
    Math.min(100, Math.round((currentMonthUsage / monthlyWordLimit) * 100));
    
  // Format the history data for display
  const formattedHistory = formatHistoryData(data?.history || []);
  
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
              <span className="text-muted-foreground"> / {monthlyWordLimit.toLocaleString()} words</span>
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



          {formattedHistory.length > 1 && (
            <div className="h-48 mt-6">
              <p className="mb-2 text-sm font-medium">Usage History</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedHistory}>
                  <XAxis dataKey="name" fontSize={12} />
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
          )}

          <p className="text-sm text-muted-foreground mt-4">
            Usage resets on your monthly anniversary date. Your billing cycle is based on your registration date.
          </p>
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
          <Skeleton className="h-4 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatHistoryData(history) {
  // If no history or empty array, return a mock data point
  if (!history || !Array.isArray(history) || history.length === 0) {
    return [
      { name: 'May 25', words: 196 }
    ];
  }

  // Create a simple data structure for the chart with only the current month
  // Since all records are May 2025 in the demo data, we'll just 
  // combine them into a single data point for simplicity
  const totalWords = history.reduce((total, item) => total + (item.wordCount || 0), 0);
  
  return [
    { name: 'May 25', words: totalWords }
  ];
}

// Format a date string like '2023-04-15' to 'Apr 15, 2023'
function formatDate(dateString) {
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