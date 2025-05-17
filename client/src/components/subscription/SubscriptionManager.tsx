import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, calculateSavings } from "@/lib/utils";

export default function SubscriptionManager() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available subscription plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });

  // Fetch the current user's word usage and plan
  const { data: usageData, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['/api/usage/words'],
  });

  // Get the user's current plan details
  const currentPlan = usageData?.subscriptionPlan;
  const billingCycle = usageData?.billingCycle;
  
  // Set the selected plan to the current plan when data is loaded
  useEffect(() => {
    if (currentPlan && !selectedPlan) {
      setSelectedPlan(currentPlan.planCode);
    }
  }, [currentPlan, selectedPlan]);

  // Mutation to update the subscription plan
  const updateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return null;
      
      const response = await apiRequest('POST', '/api/update-subscription', {
        planCode: selectedPlan
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Updated",
        description: `You've successfully updated to the ${data.plan.name} plan.`,
        variant: "default",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/usage/words'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Use the utility function for calculating savings

  if (isLoadingPlans || isLoadingUsage) {
    return <SubscriptionManagerSkeleton />;
  }

  const plans = plansData?.plans || [];
  
  // Sort plans by monthlyWordLimit
  const sortedPlans = [...plans].sort((a, b) => a.monthlyWordLimit - b.monthlyWordLimit);

  return (
    <div className="space-y-6">
      {/* Current Plan Summary */}
      {currentPlan && (
        <div className="p-4 bg-muted/50 rounded-md border">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Current Subscription
          </h3>
          <div className="flex items-center gap-2">
            <Badge className="rounded-md">{currentPlan.name} Plan</Badge>
            <span className="text-sm text-muted-foreground">
              {(currentPlan.monthlyWordLimit || 0).toLocaleString()} words per month
            </span>
          </div>
          
          {billingCycle && billingCycle.endDate && (
            <div className="mt-3 flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                Next renewal on <span className="font-medium">{formatDate(billingCycle.endDate)}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Billing Period Selector */}
      <div className="flex justify-center mb-6">
        <Tabs 
          defaultValue="monthly" 
          value={billingPeriod}
          onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")} 
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly (Save up to 30%)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {sortedPlans.map((plan) => (
                <PlanCard
                  key={plan.planCode}
                  plan={plan}
                  isCurrentPlan={currentPlan?.planCode === plan.planCode}
                  isSelected={selectedPlan === plan.planCode}
                  onSelect={() => setSelectedPlan(plan.planCode)}
                  billingPeriod={billingPeriod}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="yearly" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {sortedPlans.map((plan) => (
                <PlanCard
                  key={plan.planCode}
                  plan={plan}
                  isCurrentPlan={currentPlan?.planCode === plan.planCode}
                  isSelected={selectedPlan === plan.planCode}
                  onSelect={() => setSelectedPlan(plan.planCode)}
                  billingPeriod={billingPeriod}
                  savingsPercentage={calculateSavings(plan.monthlyPrice, plan.yearlyPrice)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Update Button */}
      <div className="flex justify-center mt-8">
        <Button 
          onClick={() => updateSubscriptionMutation.mutate()}
          disabled={
            updateSubscriptionMutation.isPending || 
            selectedPlan === currentPlan?.planCode || 
            !selectedPlan
          }
          className="w-full max-w-md"
        >
          {updateSubscriptionMutation.isPending 
            ? "Updating Subscription..." 
            : selectedPlan === currentPlan?.planCode 
              ? "Current Plan" 
              : "Update Subscription"
          }
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground text-center max-w-md mx-auto mt-4">
        Your subscription will be active immediately and the new word limit will apply to your current billing cycle.
      </p>
    </div>
  );
}

// Subscription Plan Card
interface PlanCardProps {
  plan: any;
  isCurrentPlan: boolean;
  isSelected: boolean;
  onSelect: () => void;
  billingPeriod: "monthly" | "yearly";
  savingsPercentage?: number;
}

function PlanCard({ 
  plan, 
  isCurrentPlan, 
  isSelected, 
  onSelect, 
  billingPeriod,
  savingsPercentage = 0
}: PlanCardProps) {
  // Get the price based on the billing period
  const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  
  return (
    <Card 
      className={`overflow-hidden transition-all ${
        isSelected ? "border-primary ring-2 ring-primary ring-opacity-50" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle>
          {plan.name}
          {isCurrentPlan && (
            <Badge className="ml-2 bg-primary/20 text-primary border-primary">Current</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {plan.monthlyWordLimit.toLocaleString()} words per month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">
              {price === 0 ? "Free" : `$${price}`}
            </span>
            {price > 0 && (
              <span className="text-sm text-muted-foreground ml-1">
                /{billingPeriod === "monthly" ? "mo" : "yr"}
              </span>
            )}
          </div>
          
          {billingPeriod === "yearly" && savingsPercentage > 0 && (
            <Badge 
              variant="outline" 
              className="mt-2 text-green-600 bg-green-50 border-green-200"
            >
              Save {savingsPercentage}%
            </Badge>
          )}
        </div>
        
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value={plan.planCode} 
              id={plan.planCode}
              checked={isSelected}
              onClick={onSelect}
            />
            <Label htmlFor={plan.planCode}>
              {isSelected ? "Selected" : "Select Plan"}
            </Label>
          </div>
        </RadioGroup>
        
        <ul className="mt-4 space-y-2">
          {plan.features && plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SubscriptionManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/50 rounded-md border">
        <Skeleton className="h-4 w-40 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-3 flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-4" />
              <Skeleton className="h-5 w-24 mb-4" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    </div>
  );
}