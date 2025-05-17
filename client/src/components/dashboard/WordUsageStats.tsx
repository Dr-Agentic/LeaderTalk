import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface WordUsage {
  id: number;
  userId: number;
  wordCount: number;
  cycleStartDate: string;
  cycleEndDate: string;
  monthlyAllowance: number;
}

export default function WordUsageStats() {
  const [wordUsage, setWordUsage] = useState<WordUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, authLoading } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated && !authLoading) return;
    
    const fetchWordUsage = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest<WordUsage>({
          url: "/api/users/word-usage/current",
          method: "GET",
        });
        
        if (response) {
          setWordUsage(response);
        }
      } catch (error) {
        console.error("Error fetching word usage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWordUsage();
  }, [isAuthenticated, authLoading]);
  
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
  
  // Handle the case where we don't have any word usage data yet
  if (!wordUsage) {
    const defaultAllowance = 50000;
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
              <span className="font-medium">0/{defaultAllowance.toLocaleString()} words</span>
            </div>
            <Progress value={0} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Billing cycle: Current month
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate percentage and format dates
  const percentUsed = (wordUsage.wordCount / wordUsage.monthlyAllowance) * 100;
  const startDate = new Date(wordUsage.cycleStartDate).toLocaleDateString();
  const endDate = new Date(wordUsage.cycleEndDate).toLocaleDateString();
  
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