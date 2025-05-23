import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PackageOpen, TrendingUp } from "lucide-react";

export default function WordUsageStats() {
  // Use the new billing cycle endpoint for accurate calculations
  const { data, isLoading } = useQuery({
    queryKey: ["/api/usage/billing-cycle"],
  });

  // Get current billing cycle recordings for the chart
  const { data: currentCycleRecordings, isLoading: isRecordingsLoading } =
    useQuery({
      queryKey: ["/api/recordings/current-cycle"],
      staleTime: 30000, // Cache for 30 seconds to avoid excessive requests
    });

  // Extract recordings from the enhanced current-cycle API response
  const recordingsArray = currentCycleRecordings?.recordings || [];
  console.log(
    "📊 Current cycle recordings:",
    recordingsArray.length,
    "records",
  );
  console.log("📊 Sample record:", recordingsArray[0]);

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
    daysRemaining: 0,
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="w-full">Word Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <PackageOpen className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium">Current Plan</span>
            </div>
            <div className="text-right">
              <span className="font-medium">
                {currentBillingCycleUsage.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {wordLimit ? wordLimit.toLocaleString() : "N/A"} words
              </span>
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

          {/* Current Billing Cycle Recordings Chart */}
          {!isRecordingsLoading &&
          recordingsArray &&
          recordingsArray.length > 0 ? (
            <div className="h-48 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">
                  Current Billing Cycle Recordings
                </p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recordingsArray.slice(0, 10).map((recording) => ({
                    name:
                      recording.title.length > 10
                        ? recording.title.substring(0, 10) + "..."
                        : recording.title,
                    words: recording.wordCount || 0,
                    fullTitle: recording.title,
                    date: recording.formattedDate || "N/A",
                  }))}
                >
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value) => [
                      `${value.toLocaleString()} words`,
                      "Words Used",
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return `${payload[0].payload.fullTitle} (${payload[0].payload.date})`;
                      }
                      return label;
                    }}
                  />
                  <Bar
                    dataKey="words"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            !isRecordingsLoading && (
              <div className="h-24 mt-6 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">
                  No recordings in current billing cycle
                </p>
              </div>
            )
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
