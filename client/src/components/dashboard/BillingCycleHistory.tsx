import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp, CalendarDays, Target } from "lucide-react";
import { format, subMonths } from "date-fns";

interface BillingCycleData {
  cycleLabel: string;
  cycleStart: string;
  cycleEnd: string;
  wordsUsed: number;
  wordLimit: number;
  usagePercentage: number;
  isCurrent: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as BillingCycleData;

    return (
      <div className="bg-background border rounded-md shadow-md p-3 text-sm">
        <p className="font-semibold text-primary">{data.cycleLabel}</p>
        <p className="text-xs text-muted-foreground mb-2">
          {new Date(data.cycleStart).toLocaleDateString()} -{" "}
          {new Date(data.cycleEnd).toLocaleDateString()}
        </p>
        <p className="text-sm">
          Words used:{" "}
          <span className="font-medium">{data.wordsUsed.toLocaleString()}</span>
        </p>
        <p className="text-sm">
          Word limit:{" "}
          <span className="font-medium">{data.wordLimit.toLocaleString()}</span>
        </p>
        <p className="text-sm">
          Usage: <span className="font-medium">{data.usagePercentage}%</span>
        </p>
        {data.isCurrent && (
          <p className="text-xs text-green-600 mt-1">Current cycle</p>
        )}
      </div>
    );
  }
  return null;
}

export default function BillingCycleHistory() {
  // Get current subscription to determine billing cycle dates
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/current-subscription"],
  });

  // Get current billing cycle usage
  const { data: currentUsageData } = useQuery({
    queryKey: ["/api/usage/billing-cycle"],
  });

  // Check if we have valid subscription data
  const hasValidSubscription =
    subscriptionData?.success && subscriptionData.subscription;

  if (!hasValidSubscription || !currentUsageData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Billing Cycle History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
            <p>No subscription data available</p>
            <p className="text-sm mt-2">
              Please set up your subscription to view billing cycle history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = subscriptionData.subscription;
  const currentUsage = currentUsageData || {
    currentUsage: 0,
    wordLimit: 10000,
    billingCycle: {
      startDate: '2025-01-26',
      endDate: '2025-02-25',
      daysRemaining: 30
    }
  };

  // Generate billing cycle history data using server-calculated monthly periods
  const generateCycleHistory = (): BillingCycleData[] => {
    const cycles: BillingCycleData[] = [];
    
    // Check if we have valid billing cycle data
    if (!currentUsage.billingCycle?.startDate || !currentUsage.billingCycle?.endDate) {
      return [];
    }
    
    // Use the correct monthly billing cycle dates from the server
    const currentCycleStart = new Date(currentUsage.billingCycle.startDate);
    const currentCycleEnd = new Date(currentUsage.billingCycle.endDate);
    
    // Generate 6 cycles: current + 5 previous monthly cycles
    for (let i = 0; i < 6; i++) {
      const cycleStart = subMonths(currentCycleStart, i);
      const cycleEnd = subMonths(currentCycleEnd, i);

      const isCurrent = i === 0;
      const cycleLabel = isCurrent ? "Current" : format(cycleStart, "MMM yyyy");

      // For current cycle, use actual usage data; for historical cycles, show 0 (no historical data yet)
      const wordsUsed = isCurrent ? currentUsage.currentUsage : 0;
      const wordLimit = currentUsage.wordLimit;
      const usagePercentage = Math.round((wordsUsed / wordLimit) * 100);

      cycles.push({
        cycleLabel,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        wordsUsed,
        wordLimit,
        usagePercentage,
        isCurrent,
      });
    }

    // Reverse to show oldest to newest
    return cycles.reverse();
  };

  const cycleHistory = generateCycleHistory();
  const maxUsage = Math.max(...cycleHistory.map((c) => c.wordsUsed));
  const avgLimit = cycleHistory[0]?.wordLimit || 500;

  // Get bar color based on usage percentage
  const getBarColor = (cycle: BillingCycleData) => {
    if (cycle.isCurrent) return "hsl(var(--primary))";
    if (cycle.usagePercentage > 90) return "hsl(var(--destructive))";
    if (cycle.usagePercentage > 70) return "hsl(var(--warning))";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Billing Cycle History
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Word usage across your last 6 monthly cycles
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Limit: {avgLimit.toLocaleString()} words/cycle</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cycleHistory}
              margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="cycleLabel"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
                domain={[0, Math.max(maxUsage * 1.2, avgLimit * 1.1)]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Reference line for word limit */}
              <ReferenceLine
                y={avgLimit}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{ value: "Limit", position: "topRight" }}
              />

              <Bar dataKey="wordsUsed" name="Words Used" radius={[4, 4, 0, 0]}>
                {cycleHistory.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry)}
                    stroke={
                      entry.isCurrent ? "hsl(var(--primary))" : "transparent"
                    }
                    strokeWidth={entry.isCurrent ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {currentUsage.currentUsage.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Current Cycle</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {Math.round(
                (currentUsage.currentUsage / currentUsage.wordLimit) * 100,
              )}
              %
            </p>
            <p className="text-xs text-muted-foreground">Usage Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {(
                currentUsage.wordLimit - currentUsage.currentUsage
              ).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Note:</span> Historical data shows
            past billing cycles. Only current cycle shows actual usage data.
            Historical usage tracking will be enhanced in future updates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BillingCycleHistorySkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full mb-6" />
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-3 w-18 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { BillingCycleHistorySkeleton };
