import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function WordUsageStats() {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  
  // Simulated word usage data
  const [wordUsage, setWordUsage] = useState({
    wordCount: 12500,
    monthlyAllowance: 50000,
    cycleStartDate: new Date(new Date().setDate(1)), // First day of current month
    cycleEndDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last day of current month
  });
  
  useEffect(() => {
    // Simulate loading state for better UI experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Word Usage</CardTitle>
          <CardDescription>Your current billing cycle word usage</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }
  
  // Calculate percentage and format dates
  const percentUsed = (wordUsage.wordCount / wordUsage.monthlyAllowance) * 100;
  const startDate = wordUsage.cycleStartDate.toLocaleDateString();
  const endDate = wordUsage.cycleEndDate.toLocaleDateString();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Word Usage</CardTitle>
        <CardDescription>Your current billing cycle word usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Used</span>
            <span className="font-medium">
              {wordUsage.wordCount.toLocaleString()}/{wordUsage.monthlyAllowance.toLocaleString()} words
            </span>
          </div>
          <Progress value={percentUsed} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Billing cycle: {startDate} to {endDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}