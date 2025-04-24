import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Monthly word limit for billing
const MONTHLY_WORD_LIMIT = 50000;

export default function WordUsageStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/usage/words'],
  });

  if (isLoading) {
    return <WordUsageStatsSkeleton />;
  }

  const currentMonthUsage = data?.currentMonthUsage || 0;
  const usagePercentage = Math.min(100, (currentMonthUsage / MONTHLY_WORD_LIMIT) * 100);
  const formattedHistory = formatHistoryData(data?.history || []);

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
            Usage resets on the 1st of each month. Exceeding your word limit may affect billing.
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
    .map(item => ({
      name: `${monthNames[item.month - 1]} ${String(item.year).slice(2)}`,
      words: item.wordCount
    }))
    .reverse(); // Show oldest to newest
}