import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, ExternalLink, Check, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Payment Setup Form Component
function PaymentSetupForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription',
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Method Setup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Method Added",
          description: "Your payment method has been successfully added!",
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <CreditCard className="h-5 w-5" />
          <span>Add Payment Method</span>
        </CardTitle>
        <CardDescription className="text-blue-600">
          Please add a payment method to update your subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            disabled={!stripe || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up payment method...
              </>
            ) : (
              'Add Payment Method'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

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

  // Update subscription mutation
  const updateSubscription = useMutation({
    mutationFn: async (planData: { stripePriceId: string }) => {
      const response = await fetch('/api/billing/subscriptions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(planData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        // Handle payment method collection with Stripe
        toast({
          title: "Payment Method Required",
          description: "Please update your payment method to complete the subscription change.",
        });
        // TODO: Implement Stripe Elements for payment method collection
      } else {
        toast({
          title: "Success!",
          description: "Your subscription has been updated successfully",
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

  const handleSubscribe = (plan: BillingProduct) => {
    if (plan.pricing.stripePriceId) {
      updateSubscription.mutate({ stripePriceId: plan.pricing.stripePriceId });
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div>
                <p className="font-medium">Subscription Created</p>
                <p className="text-sm">
                  You first subscribed on {currentSubscription.subscription.formattedStartDate}
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
              {/* Pricing */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {plan.pricing.formattedPrice}
                </div>
                {plan.pricing.formattedSavings && (
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {plan.pricing.formattedSavings}
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>{plan.features.wordLimit.toLocaleString()} words/month</span>
                </div>
                {plan.features.advancedAnalytics && (
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Advanced analytics</span>
                  </div>
                )}
                {plan.features.prioritySupport && (
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Priority support</span>
                  </div>
                )}
                {plan.billingType === 'yearly' && (
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-blue-600 font-medium">Best value option</span>
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleSubscribe(plan)}
                disabled={updateSubscription.isPending}
                variant={plan.isPopular ? "default" : "outline"}
              >
                {updateSubscription.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentSubscription?.subscription?.plan === plan.code ? (
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