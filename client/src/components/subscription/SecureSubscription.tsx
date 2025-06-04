import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface BillingProduct {
  id: string;
  name: string;
  pricing: {
    monthly?: { stripePriceId: string; amount: number; formattedAmount: string };
    yearly?: { stripePriceId: string; amount: number; formattedAmount: string };
  };
  wordLimit: number;
  features: string[];
  isPopular: boolean;
}

interface CurrentSubscription {
  success: boolean;
  hasSubscription: boolean;
  formattedMessage?: string;
  subscription?: {
    id: string;
    status: string;
    plan: string;
    planId: string;
    isFree: boolean;
    formattedAmount: string;
    formattedInterval: string;
    startDate: Date;
    formattedStartDate: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    formattedCurrentPeriod: string;
    nextRenewalDate: Date;
    formattedNextRenewal: string;
    wordLimit: number;
    currentUsage: number;
    formattedUsage: string;
    usagePercentage: number;
    cancelAtPeriodEnd: boolean;
    formattedStatus: string;
    statusColor: string;
    daysRemaining: number;
    formattedDaysRemaining: string;
  };
}

function PaymentSetupForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  // Placeholder for payment setup form - you'll need to implement this
  return (
    <div className="p-4 border rounded bg-gray-800/50">
      <p className="text-white">Payment setup form would go here</p>
      <Button onClick={onSuccess} className="mt-4">Complete Setup</Button>
    </div>
  );
}

export default function SecureSubscription() {
  const [selectedPlan, setSelectedPlan] = useState<BillingProduct | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [paymentSetup, setPaymentSetup] = useState<{
    clientSecret: string;
    planId: string;
  } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } =
    useQuery<CurrentSubscription>({
      queryKey: ["/api/billing/subscriptions/current"],
      enabled: true,
    });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery<BillingProduct[]>({
    queryKey: ["/api/billing/products"],
    enabled: true,
  });

  // Update subscription mutation
  const updateSubscription = useMutation({
    mutationFn: async (planData: { stripePriceId: string }) => {
      const response = await fetch("/api/billing/subscriptions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update subscription");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/billing/subscriptions/current"],
      });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      if (error.message?.includes("payment method")) {
        // Handle payment method setup
        setPaymentSetup({
          clientSecret: error.clientSecret || "",
          planId: selectedPlan?.id || "",
        });
      } else {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update subscription",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubscribe = (plan: BillingProduct) => {
    const priceId = plan.pricing[billingInterval]?.stripePriceId;
    if (priceId) {
      updateSubscription.mutate({ stripePriceId: priceId });
    }
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-white">Loading subscription details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-lg text-gray-300">
          Upgrade your leadership training with premium features and increased word limits
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription?.hasSubscription && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Plan</p>
                <p className="text-white font-medium">
                  {currentSubscription.subscription?.plan}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <Badge className={currentSubscription.subscription?.statusColor}>
                  {currentSubscription.subscription?.formattedStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
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

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => {
          const currentPlan = currentSubscription?.subscription;
          const isCurrentPlan = currentPlan?.planId === plan.id;
          const pricing = plan.pricing[billingInterval];

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
                {pricing && (
                  <div className="text-3xl font-bold text-primary">
                    {pricing.formattedAmount}
                    <span className="text-sm text-gray-400">
                      /{billingInterval === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                )}
                <CardDescription>
                  {plan.wordLimit.toLocaleString()} words per month
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-gray-300">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan || updateSubscription.isPending}
                  variant={isCurrentPlan ? "secondary" : "default"}
                >
                  {updateSubscription.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    isCurrentPlan ? "Current Plan" : `Choose ${plan.name.replace('LeaderTalk_', '')}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Setup Form */}
      {paymentSetup && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: paymentSetup.clientSecret }}
        >
          <PaymentSetupForm
            clientSecret={paymentSetup.clientSecret}
            onSuccess={() => {
              setPaymentSetup(null);
              queryClient.invalidateQueries({
                queryKey: ["/api/billing/subscriptions/current"],
              });
              toast({
                title: "Payment Method Added",
                description: "Your payment method has been added successfully!",
              });
            }}
          />
        </Elements>
      )}
    </div>
  );
}