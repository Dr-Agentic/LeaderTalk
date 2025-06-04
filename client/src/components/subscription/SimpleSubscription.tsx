import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionPlan {
  id: string;
  planCode: string;
  name: string;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
  wordLimit: number;
  features: string[];
  isPopular: boolean;
}

interface PlansResponse {
  plans: SubscriptionPlan[];
}

export default function SimpleSubscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available subscription plans
  const { data: plansData, isLoading, error } = useQuery<PlansResponse>({
    queryKey: ["/api/subscription-plans"],
  });

  const plans = plansData?.plans || [];

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (planCode: string) => {
      const response = await apiRequest("POST", "/api/update-subscription", { 
        planCode,
        billingInterval 
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Updated",
        description: `Successfully updated to ${data.plan?.name || 'new plan'}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/usage/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/subscriptions/current"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update subscription. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handlePlanUpdate = () => {
    if (selectedPlan) {
      updateSubscriptionMutation.mutate(selectedPlan);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-white">Loading plans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-destructive/10 border-destructive">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle>Error Loading Plans</AlertTitle>
        <AlertDescription>
          Could not load subscription plans. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
        <p className="text-gray-300">
          Select a subscription plan that fits your leadership training needs
        </p>
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-800 p-1 rounded-lg">
          <Button
            variant={billingInterval === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingInterval("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingInterval("yearly")}
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Plan Selection */}
      <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all ${
                selectedPlan === plan.planCode 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "hover:bg-gray-800/50"
              }`}
              onClick={() => setSelectedPlan(plan.planCode)}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  ${billingInterval === "monthly" ? plan.monthlyPriceUsd : plan.yearlyPriceUsd}
                  <span className="text-sm text-gray-400">
                    /{billingInterval === "monthly" ? "month" : "year"}
                  </span>
                </div>
                <CardDescription>
                  {plan.wordLimit.toLocaleString()} words per month
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <RadioGroupItem value={plan.planCode} id={plan.planCode} />
                  <Label htmlFor={plan.planCode} className="sr-only">
                    Select {plan.name}
                  </Label>
                </div>

                <ul className="space-y-2 text-sm text-gray-300">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handlePlanUpdate}
          disabled={!selectedPlan || updateSubscriptionMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateSubscriptionMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Update Plan
            </>
          )}
        </Button>
      </div>

      {/* Contact Support Note */}
      <div className="text-center text-sm text-gray-400">
        Need help choosing a plan? Contact our support team for assistance.
      </div>
    </div>
  );
}