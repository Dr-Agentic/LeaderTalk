import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarIcon } from "lucide-react";

// Monthly word limit for billing
const MONTHLY_WORD_LIMIT = 50000;

export default function WordUsageStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/usage/words'],
  });

  if (isLoading) {
    return <WordUsageStatsSkeleton />;
  }

  // Sum up the word count from all entries in the current month
  const currentMonthUsage = data?.currentMonthUsage || 0;
  // Calculate the percentage of the monthly limit
  const usagePercentage = Math.min(100, (currentMonthUsage / MONTHLY_WORD_LIMIT) * 100);
  // Format the history data for display
  const formattedHistory = formatHistoryData(data?.history || []);
  // Billing cycle information
  const billingCycle = data?.billingCycle || {};

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Word Usage</span>
          <span className="text-sm font-normal text-muted-foreground">
            {currentMonthUsage.toLocaleString()} / {MONTHLY_WORD_LIMIT.toLocaleString()} words
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Progress value={usagePercentage} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.round(usagePercentage)}% of your monthly word allocation used
            </p>
          </div>

          {/* Billing cycle information */}
          {billingCycle && billingCycle.startDate && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Current Billing Cycle</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(billingCycle.startDate)} — {formatDate(billingCycle.endDate)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {billingCycle.daysRemaining} days remaining in this cycle
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    Next reset: {formatDate(billingCycle.endDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

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
  if (!history || !Array.isArray(history)) return [];

  // Map the month number to a month name
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return history
    .slice(0, 6) // Only show last 6 months
    .map(item => {
      // Check if the item has the new format (displayName) or old format (year/month)
      if (item.displayName) {
        return {
          name: item.displayName,
          words: item.wordCount
        };
      } else {
        return {
          name: `${monthNames[item.month - 1]} ${String(item.year).slice(2)}`,
          words: item.wordCount
        };
      }
    })
    .reverse(); // Show oldest to newest
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