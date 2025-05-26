import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Loader2, ExternalLink, Check, CreditCard, AlertTriangle, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
      console.log('🔄 Starting payment method setup...');
      
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription',
        },
        redirect: 'if_required'
      });

      console.log('💳 Setup result:', { error, setupIntent });

      if (error) {
        console.error('❌ Payment setup failed:', error);
        toast({
          title: "Payment Method Setup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        console.log('✅ Payment method successfully added to Stripe!');
        toast({
          title: "Payment Method Added",
          description: "Your payment method has been successfully added!",
        });
        onSuccess();
      } else {
        console.log('⚠️ Setup intent status:', setupIntent?.status);
        toast({
          title: "Payment Setup Incomplete",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
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
  const [paymentSetup, setPaymentSetup] = useState<{ clientSecret: string; planId: string } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
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
    onSuccess: (data, variables) => {
      if (data.requiresPayment && data.clientSecret) {
        // Show payment setup form
        setPaymentSetup({
          clientSecret: data.clientSecret,
          planId: data.planId || 'unknown'
        });
        toast({
          title: "Payment Method Required",
          description: "Please add a payment method to complete the subscription change.",
        });
      } else {
        // Enhanced success messaging based on subscription change type
        showSubscriptionSuccessMessage(data, variables);
        // Force immediate refresh of subscription data
        queryClient.invalidateQueries({ queryKey: ['/api/billing/subscriptions/current'] });
        queryClient.refetchQueries({ queryKey: ['/api/billing/subscriptions/current'] });
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

  // Cancellation mutation for paid subscriptions
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/billing/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: `Your subscription has been cancelled. You'll continue to enjoy Executive features until ${currentSubscription?.subscription?.formattedNextRenewal}, then switch to the free Starter plan.`,
        duration: 8000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/subscriptions/current'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Enhanced success messaging based on subscription change type
  const showSubscriptionSuccessMessage = (data: any, variables: any) => {
    const currentPlan = currentSubscription?.subscription?.plan || '';
    const newPlan = data.newPlan || '';
    const amount = data.amount || 0;
    const interval = data.interval || '';
    const nextRenewal = data.nextRenewal || '';

    // Determine subscription change type and show appropriate message
    if (currentPlan === 'leadertalk_starter' && newPlan.includes('exec')) {
      // Free to Paid Upgrade
      toast({
        title: "🎉 Congratulations! Welcome to Executive!",
        description: `You've successfully upgraded to our premium plan! You'll be billed ${amount} ${interval}ly starting ${nextRenewal}. Your subscription will renew automatically until cancelled.`,
        duration: 8000,
      });
    } else if (interval === 'year' && currentPlan.includes('monthly')) {
      // Monthly to Yearly
      toast({
        title: "🎉 Congratulations! Annual Savings Activated!",
        description: `You've switched to our annual plan! You'll continue with your monthly plan until the cycle ends, then your annual subscription (${amount}/year) begins and renews automatically until cancelled.`,
        duration: 8000,
      });
    } else if (newPlan === 'leadertalk_starter' && currentPlan.includes('exec')) {
      // Paid to Free Downgrade
      toast({
        title: "Subscription Updated",
        description: `You've switched to our free starter plan. No refunds will be provided - you'll continue enjoying your Executive benefits until ${nextRenewal}, then switch to the Starter plan.`,
        duration: 8000,
      });
    } else {
      // General success message
      toast({
        title: "Success!",
        description: "Your subscription has been updated successfully",
        duration: 5000,
      });
    }
  };

  const handleSubscribe = (plan: BillingProduct) => {
    const priceId = plan.pricing[billingInterval]?.stripePriceId;
    if (priceId) {
      updateSubscription.mutate({ stripePriceId: priceId });
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
            className={`relative flex flex-col h-full transition-all duration-200 hover:shadow-lg ${
              selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader className="flex-shrink-0">
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
            
            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
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
              </div>
              
              {/* Button anchored to bottom */}
              <Button 
                className="w-full mt-auto text-xs py-3 px-2 h-auto min-h-[48px] whitespace-normal break-words" 
                onClick={() => handleSubscribe(plan)}
                disabled={updateSubscription.isPending}
                variant="default"
              >
                <div className="text-center leading-relaxed">
                  {updateSubscription.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    (() => {
                      const currentPriceId = currentSubscription?.subscription?.priceId;
                      // Check if current plan matches this specific plan's price ID
                      const planPriceId = plan.pricing?.stripePriceId;
                      const isCurrentPlan = currentPriceId === planPriceId;
                      
                      console.log('🔍 Price ID comparison:', {
                        currentPriceId,
                        planPriceId,
                        isCurrentPlan,
                        planName: plan.name
                      });
                      
                      return isCurrentPlan ? "Current Plan" : `Subscribe to ${plan.name}`;
                    })()
                  )}
                </div>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Setup Form */}
      {paymentSetup && (
        <Elements stripe={stripePromise} options={{ clientSecret: paymentSetup.clientSecret }}>
          <PaymentSetupForm 
            clientSecret={paymentSetup.clientSecret}
            onSuccess={() => {
              setPaymentSetup(null);
              queryClient.invalidateQueries({ queryKey: ['/api/billing/subscriptions/current'] });
              toast({
                title: "Payment Method Added",
                description: "Your payment method has been added successfully! Please try updating your subscription again.",
              });
            }}
          />
        </Elements>
      )}

      {/* Downgrade Section - Only for paid plans */}
      {currentSubscription?.subscription && !currentSubscription.subscription.isFree && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-blue-800 mb-3">
              <Info className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Switch to Starter Plan</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Switch back to the free Starter plan (500 words/month). You can upgrade again anytime.
            </p>
            <Button
              onClick={() => {
                const starterProduct = plans?.find(p => p.code.toLowerCase().includes('starter'));
                if (starterProduct) {
                  updateSubscription.mutate({ stripePriceId: starterProduct.pricing.stripePriceId });
                }
              }}
              disabled={updateSubscription.isPending}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {updateSubscription.isPending ? 'Switching...' : 'Switch to Starter'}
            </Button>
          </CardContent>
        </Card>
      )}

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

      {/* Embedded Cancellation Confirmation Modal */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Subscription?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              <div>
                Are you sure you want to cancel your Executive subscription? This action cannot be undone.
              </div>
              <div className="mt-4">
                <strong>What happens next:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>You'll continue to enjoy all Executive features until {currentSubscription?.subscription?.formattedNextRenewal}</li>
                  <li>After that, your account will automatically switch to the free Starter plan</li>
                  <li>No refunds will be provided for the current billing period</li>
                  <li>You can resubscribe at any time to regain Executive access</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelSubscription.mutate();
                setShowCancelDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}