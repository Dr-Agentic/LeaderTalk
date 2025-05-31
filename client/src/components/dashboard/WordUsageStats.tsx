import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PackageOpen, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function WordUsageStats() {
  const [timeView, setTimeView] = useState<"week" | "month" | "cycle">("cycle");

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

  // Custom tooltip component similar to BillingCycleHistory
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-gray-800 border border-gray-600 rounded-md shadow-md p-3 text-sm">
          <p className="font-semibold text-primary">{data.fullTitle}</p>
          <p className="text-xs text-gray-300 mb-2">
            {data.date}
          </p>
          <p className="text-sm text-white">
            Words used:{" "}
            <span className="font-medium">{data.words.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Word Usage</CardTitle>
          <Select value={timeView} onValueChange={(value) => setTimeView(value as "week" | "month" | "cycle")}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="week" className="text-white hover:bg-gray-700">Last 7 Days</SelectItem>
              <SelectItem value="month" className="text-white hover:bg-gray-700">Last 30 Days</SelectItem>
              <SelectItem value="cycle" className="text-white hover:bg-gray-700">Current Cycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <PackageOpen className="h-4 w-4 mr-2 text-primary" />
              <span className="font-medium text-white">Current Plan</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-white">
                {currentBillingCycleUsage.toLocaleString()}
              </span>
              <span className="text-gray-300">
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
            <p className="mt-2 text-sm text-gray-300">
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
                <p className="text-sm font-medium text-white">
                  Current Billing Cycle Recordings
                </p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recordingsArray.slice(0, 10).map((recording: any) => ({
                    name: recording.id,
                    words: recording.wordCount || 0,
                    fullTitle: recording.title,
                    date: recording.formattedDate || "N/A",
                  }))}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#ffffff" }}
                    interval={0}
                    axisLine={{ stroke: "#6B7280" }}
                    tickLine={{ stroke: "#6B7280" }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "#ffffff" }}
                    axisLine={{ stroke: "#6B7280" }}
                    tickLine={{ stroke: "#6B7280" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="words"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            !isRecordingsLoading && (
              <div className="h-24 mt-6 flex items-center justify-center text-gray-400">
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
