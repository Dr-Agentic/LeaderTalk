import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface BillingProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  productIcon: string | null;
  pricing: {
    monthly: {
      amount: number;
      formattedPrice: string;
      interval: string;
    };
    yearly: {
      amount: number;
      formattedPrice: string;
      formattedSavings?: string;
      interval: string;
    };
  };
  features: {
    wordLimit: number;
    formattedWordLimit: string;
    benefits: string[];
  };
  isDefault: boolean;
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
    
    // Formatted amounts
    formattedAmount: string;
    formattedInterval: string;
    
    // Formatted dates
    startDate: Date;
    formattedStartDate: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    formattedCurrentPeriod: string;
    nextRenewalDate: Date;
    formattedNextRenewal: string;
    
    // Word usage with formatting
    wordLimit: number;
    currentUsage: number;
    formattedUsage: string;
    usagePercentage: number;
    
    // Status formatting
    cancelAtPeriodEnd: boolean;
    formattedStatus: string;
    statusColor: string;
    
    // Billing cycle info
    daysRemaining: number;
    formattedDaysRemaining: string;
  };
}

export default function SecureSubscription() {
  const [selectedPlan, setSelectedPlan] = useState<BillingProduct | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<CurrentSubscription>({
    queryKey: ['/api/billing/subscriptions/current'],
    enabled: true
  });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/billing/products'],
    enabled: true
  });

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async (planData: { planCode: string }) => {
      const response = await fetch('/api/billing/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(planData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to payment checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Success!",
          description: "Subscription created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/billing/subscriptions/current'] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubscribe = (plan: SubscriptionPlan) => {
    createSubscription.mutate({ planCode: plan.priceId });
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Upgrade your leadership training with premium features and increased word limits
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription?.hasSubscription && currentSubscription.subscription && (
        <Card className="border-blue-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Current Subscription</CardTitle>
                <CardDescription className="text-gray-600">
                  You're subscribed to {currentSubscription.subscription.plan}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {currentSubscription.subscription.formattedStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-medium">Word Usage</p>
                <p className="text-2xl font-bold">{currentSubscription.subscription.formattedUsage}</p>
              </div>
              <div>
                <p className="font-medium">Amount</p>
                <p className="text-2xl font-bold">
                  {currentSubscription.subscription.formattedAmount}{currentSubscription.subscription.formattedInterval}
                </p>
              </div>
              <div>
                <p className="font-medium">Next Billing</p>
                <p className="text-sm">
                  {currentSubscription.subscription.formattedNextRenewal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 hover:shadow-lg ${
              selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {plan.productIcon && (
                    <img 
                      src={plan.productIcon} 
                      alt={`${plan.name} icon`}
                      className="w-8 h-8 rounded-md object-cover"
                    />
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                {plan.isPopular && (
                  <Badge variant="default">Popular</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Monthly Pricing */}
              <div className="text-center border-b pb-4">
                <div className="mb-2">
                  <span className="text-2xl font-bold">
                    {plan.pricing.monthly.formattedPrice}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Monthly billing</p>
              </div>
              
              {/* Yearly Pricing */}
              <div className="text-center">
                <div className="mb-2">
                  <span className="text-2xl font-bold">
                    {plan.pricing.yearly?.formattedPrice || 'Not available'}
                  </span>
                  {plan.pricing.yearly?.formattedSavings && (
                    <span className="ml-2 text-sm text-green-600 font-medium">
                      {plan.pricing.yearly.formattedSavings}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Yearly billing</p>
              </div>
              
              <div>
                <p className="font-medium text-center mb-2">
                  {plan.features.formattedWordLimit}
                </p>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <p className="font-medium">Features included:</p>
                {plan.features.benefits?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleSubscribe(plan)}
                disabled={createSubscription.isPending || currentSubscription?.planId === plan.priceId}
                variant={currentSubscription?.planId === plan.priceId ? "secondary" : "default"}
              >
                {createSubscription.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentSubscription?.planId === plan.priceId ? (
                  "Current Plan"
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Secure Payment Processing</p>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            All payments are processed securely through Stripe. Your payment information is never stored on our servers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}