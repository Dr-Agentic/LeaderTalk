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
  CartesianGrid,
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
      <div className="bg-gray-800 border border-gray-600 rounded-md shadow-md p-3 text-sm">
        <p className="font-semibold text-primary">{data.cycleLabel}</p>
        <p className="text-xs card-description mb-2">
          {new Date(data.cycleStart).toLocaleDateString()} -{" "}
          {new Date(data.cycleEnd).toLocaleDateString()}
        </p>
        <p className="text-sm card-title">
          Words used:{" "}
          <span className="font-medium">{data.wordsUsed.toLocaleString()}</span>
        </p>
        <p className="text-sm card-title">
          Word limit:{" "}
          <span className="font-medium">{data.wordLimit.toLocaleString()}</span>
        </p>
        <p className="text-sm card-title">
          Usage: <span className="font-medium">{data.usagePercentage}%</span>
        </p>
        {data.isCurrent && (
          <p className="text-xs text-green-400 mt-1">Current cycle</p>
        )}
      </div>
    );
  }
  return null;
}

export default function BillingCycleHistory() {
  // Get current subscription to determine billing cycle dates
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/billing/subscriptions/current"],
  });

  // Get historical billing cycle data (6 monthly cycles)
  const { data: historicalData } = useQuery({
    queryKey: ["/api/usage/billing-cycle", { monthlyCycles: 6 }],
    queryFn: () => fetch('/api/usage/billing-cycle?monthlyCycles=6').then(res => res.json()),
  });

  // Check if we have valid subscription data
  const hasValidSubscription =
    subscriptionData?.success && subscriptionData.subscription;

  if (!hasValidSubscription || !historicalData?.success || !historicalData?.historicalCycles) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Billing Cycle History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center card-description">
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
  const historicalCycles = historicalData.historicalCycles;
  
  // Use real historical data from server
  const billingCycleData: BillingCycleData[] = historicalCycles.map((cycle: any) => ({
    month: cycle.cycleLabel,
    wordsUsed: cycle.wordsUsed,
    wordLimit: cycle.wordLimit,
    usagePercentage: cycle.usagePercentage,
    isCurrent: cycle.isCurrent
  }));

  const maxUsage = Math.max(...billingCycleData.map((c) => c.wordsUsed));
  const avgLimit = billingCycleData[0]?.wordLimit || 500;

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
            <CardTitle className="text-2xl font-bold flex items-center gap-2 card-title">
              <TrendingUp className="h-6 w-6" />
              Billing Cycle History
            </CardTitle>
            <p className="text-sm card-description mt-1">
              Word usage across your last 6 monthly cycles
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm card-description">
              <Target className="h-4 w-4" />
              <span>Limit: {avgLimit.toLocaleString()} words/cycle</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={billingCycleData}
              margin={{ top: 20, right: 20, left: 50, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#ffffff" }}
                padding={{ left: 10, right: 10 }}
                height={60}
                axisLine={{ stroke: "#6B7280" }}
                tickLine={{ stroke: "#6B7280" }}
              />
              <YAxis
                tickFormatter={(value) => value.toLocaleString()}
                domain={[0, Math.max(maxUsage * 1.2, avgLimit * 1.1)]}
                tick={{ fontSize: 12, fill: "#ffffff" }}
                width={40}
                axisLine={{ stroke: "#6B7280" }}
                tickLine={{ stroke: "#6B7280" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Reference line for word limit */}
              <ReferenceLine
                y={avgLimit}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{ value: "Limit", position: "topRight" }}
              />

              <Bar dataKey="wordsUsed" name="Words Used" radius={[4, 4, 0, 0]} minPointSize={8}>
                {billingCycleData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.wordsUsed === 0 ? "#374151" : "#3B82F6"}
                    fillOpacity={entry.wordsUsed === 0 ? 0.6 : 1}
                    stroke={
                      entry.isCurrent ? "#60A5FA" : "transparent"
                    }
                    strokeWidth={entry.isCurrent ? 3 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
