import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CurrentSubscription {
  success: boolean;
  hasSubscription: boolean;
  subscription?: {
    plan: string;
    status: string;
    formattedAmount: string;
    formattedInterval: string;
    wordLimit: number;
    currentUsage: number;
    formattedUsage: string;
    usagePercentage: number;
    formattedNextRenewal: string;
    cancelAtPeriodEnd: boolean;
    formattedStatus: string;
    statusColor: string;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  pricing: {
    monthly?: { amount: number; formattedAmount: string };
    yearly?: { amount: number; formattedAmount: string };
  };
  wordLimit: number;
  features: string[];
  isPopular: boolean;
}

export default function PlanManager() {
  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<CurrentSubscription>({
    queryKey: ["/api/billing/subscriptions/current"],
  });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading, error } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/billing/products"],
  });

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-white">Loading subscription details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-destructive/10 border-destructive">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle>Error Loading Plans</AlertTitle>
        <AlertDescription>
          Could not load subscription information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const currentPlan = currentSubscription?.subscription?.plan;

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {currentSubscription?.hasSubscription && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Current Plan
              <Badge variant="outline" className={`${currentSubscription.subscription?.statusColor || 'text-green-400'}`}>
                {currentSubscription.subscription?.formattedStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Plan</p>
                <p className="text-white font-medium">
                  {currentSubscription.subscription?.plan}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-white font-medium">
                  {currentSubscription.subscription?.formattedAmount}
                  {currentSubscription.subscription?.formattedInterval}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Word Usage</p>
                <p className="text-white font-medium">
                  {currentSubscription.subscription?.formattedUsage}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Next Renewal</p>
                <p className="text-white font-medium">
                  {currentSubscription.subscription?.formattedNextRenewal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const isCurrentPlan = currentPlan && 
              currentPlan.toLowerCase().includes(plan.name.toLowerCase().replace('leadertalk_', ''));

            return (
              <Card 
                key={plan.id} 
                className={`relative ${
                  isCurrentPlan 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "bg-gray-800/50 border-gray-700"
                }`}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-white">
                    {plan.name.replace('LeaderTalk_', '')}
                  </CardTitle>
                  <div className="space-y-2">
                    {plan.pricing.monthly && (
                      <div className="text-2xl font-bold text-primary">
                        {plan.pricing.monthly.formattedAmount}
                        <span className="text-sm text-gray-400">/month</span>
                      </div>
                    )}
                    {plan.pricing.yearly && (
                      <div className="text-lg text-gray-300">
                        {plan.pricing.yearly.formattedAmount}
                        <span className="text-sm text-gray-400">/year</span>
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    {plan.wordLimit.toLocaleString()} words per month
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isCurrentPlan && (
                    <Badge variant="secondary" className="w-full justify-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Current Plan
                    </Badge>
                  )}

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
            );
          })}
        </div>
      </div>

      {/* Contact Support for Plan Changes */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Need to Change Your Plan?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            To upgrade, downgrade, or cancel your subscription, please contact our support team. 
            We'll help you find the perfect plan for your needs.
          </p>
          <Button variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}