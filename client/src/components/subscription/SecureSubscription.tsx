import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Loader2,
  ExternalLink,
  Check,
  CreditCard,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";
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
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import PaymentMethodSelector from "./PaymentMethodSelector";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

// Helper function to poll subscription status until payment method is processed
async function waitForPaymentMethodAttachment(): Promise<void> {
  const maxAttempts = 8;
  const delayMs = 1500;
  
  console.log("⏳ Polling subscription status to confirm payment method is processed...");
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch("/api/billing/subscriptions/current", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`🔍 Subscription check ${attempt}/${maxAttempts} - has payment methods available`);
        
        // If subscription check succeeds without requiring payment, payment method is ready
        if (data.success && data.hasSubscription) {
          console.log("✅ Payment method confirmed as processed - subscription endpoint accessible!");
          return;
        }
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Attempt ${attempt}/${maxAttempts} - waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`❌ Error checking subscription status:`, error);
      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }
  
  throw new Error("Payment method processing verification timeout");
}

// Payment Setup Form Component
function PaymentSetupForm({
  clientSecret,
  onSuccess,
  originalRequest,
}: {
  clientSecret: string;
  onSuccess: () => void;
  originalRequest?: { stripePriceId: string };
}) {
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
      console.log("🔄 Starting payment method setup...");

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/subscription",
        },
        redirect: "if_required",
      });

      console.log("💳 Setup result:", { error, setupIntent });

      if (error) {
        console.error("❌ Payment setup failed:", error);
        toast({
          title: "Payment Method Setup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (setupIntent && setupIntent.status === "succeeded") {
        console.log("✅ Payment method successfully added to Stripe!");
        
        // If we have an original request, retry the subscription update
        if (originalRequest) {
          console.log("🔄 Retrying original subscription update...", originalRequest);
          
          // Poll subscription status to ensure payment method is fully processed
          await waitForPaymentMethodAttachment();
          
          try {
            const retryResponse = await fetch("/api/billing/subscriptions/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(originalRequest),
            });

            console.log("🔍 Retry response status:", retryResponse.status);
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log("✅ Subscription update completed successfully!", retryData);
              
              // Check if the retry was actually successful or still requires payment
              if (retryData.requiresPayment) {
                console.log("⚠️ Retry still requires payment - something went wrong");
                toast({
                  title: "Payment Method Added",
                  description: "Payment method added, but subscription update still pending. Please try again.",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Subscription Updated!",
                  description: "Your subscription has been successfully updated with the new payment method.",
                });
              }
            } else {
              const errorData = await retryResponse.json();
              console.error("❌ Retry response error:", errorData);
              throw new Error(errorData.error || "Subscription update failed after payment setup");
            }
          } catch (retryError) {
            console.error("❌ Failed to complete subscription update:", retryError);
            toast({
              title: "Payment Method Added",
              description: "Payment method added successfully, but please try updating your subscription again.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Payment Method Added",
            description: "Your payment method has been successfully added!",
          });
        }
        
        onSuccess();
      } else {
        console.log("⚠️ Setup intent status:", setupIntent?.status);
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
    <Card className="border-gray-600 bg-gray-800/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <CreditCard className="h-5 w-5" />
          <span>Add Payment Method</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
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
              "Add Payment Method"
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
    amount: number;
    formattedPrice: string;
    formattedSavings?: string;
    interval: string;
    stripePriceId: string;
  };
  features: {
    wordLimit: number;
    maxRecordingLength: number;
    leaderLibraryAccess: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
  isDefault: boolean;
  isPopular: boolean;
  billingType: string;
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
    priceId: string;
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
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [paymentSetup, setPaymentSetup] = useState<{
    clientSecret: string;
    planId: string;
    originalRequest?: { stripePriceId: string };
  } | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentMethodSelector, setShowPaymentMethodSelector] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | undefined>();
  const [pendingSubscriptionChange, setPendingSubscriptionChange] = useState<{
    plan: BillingProduct;
    priceId: string;
    changeType: 'upgrade' | 'downgrade' | 'same';
    warningMessage?: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading, refetch: refetchSubscription } =
    useQuery<CurrentSubscription>({
      queryKey: ["/api/billing/subscriptions/current"],
      enabled: true,
    });

  // Fetch available plans
  const { data: plans, isLoading: plansLoading } = useQuery<BillingProduct[]>(
    {
      queryKey: ["/api/billing/products"],
      enabled: true,
    },
  );

  // Fetch scheduled subscription changes
  const { data: scheduledChanges, isLoading: scheduledLoading } = useQuery({
    queryKey: ["/api/billing/subscription/scheduled"],
    enabled: !!currentSubscription?.subscription?.id,
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
    onSuccess: (data, variables) => {
      if (data.requiresPayment && data.clientSecret) {
        // Store original request to retry after payment method is added
        setPaymentSetup({
          clientSecret: data.clientSecret,
          planId: data.planId || "unknown",
          originalRequest: variables, // Store the original subscription request
        });
        toast({
          title: "Payment Method Required",
          description:
            "Please add a payment method to complete the subscription change.",
        });
      } else {
        // Enhanced success messaging based on subscription change type
        showSubscriptionSuccessMessage(data, variables);
        
        // Clear subscription change state
        setPendingSubscriptionChange(null);
        setShowPaymentMethodSelector(false);
        setSelectedPaymentMethodId(undefined);
        
        // Force immediate refresh of subscription data
        queryClient.invalidateQueries({
          queryKey: ["/api/billing/subscriptions/current"],
        });
        queryClient.refetchQueries({
          queryKey: ["/api/billing/subscriptions/current"],
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancellation mutation for paid subscriptions
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/billing/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: `Your subscription has been cancelled. You'll continue to enjoy Executive features until ${currentSubscription?.subscription?.formattedNextRenewal}, then switch to the free Starter plan.`,
        duration: 8000,
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/billing/subscriptions/current"],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle canceling scheduled subscription changes
  const handleCancelScheduledChange = async (scheduleId: string) => {
    try {
      const response = await fetch("/api/billing/subscription/scheduled/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Scheduled Change Cancelled",
          description: "Your scheduled subscription change has been cancelled successfully.",
        });
        
        // Refetch subscription and scheduled changes
        await refetchSubscription();
        queryClient.invalidateQueries({
          queryKey: ["/api/billing/subscription/scheduled"],
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to cancel scheduled change",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Failed to cancel scheduled change",
      });
    }
  };

  // Enhanced success messaging based on subscription change type
  const showSubscriptionSuccessMessage = (data: any, variables: any) => {
    const currentPlan = currentSubscription?.subscription?.plan || "";
    const newPlan = data.newPlan || "";
    const amount = data.amount || 0;
    const interval = data.interval || "";
    const nextRenewal = data.nextRenewal || "";

    // Determine subscription change type and show appropriate message
    if (currentPlan === "leadertalk_starter" && newPlan.includes("exec")) {
      // Free to Paid Upgrade
      toast({
        title: "🎉 Congratulations! Welcome to Executive!",
        description: `You've successfully upgraded to our premium plan! You'll be billed ${amount} ${interval}ly starting ${nextRenewal}. Your subscription will renew automatically until cancelled.`,
        duration: 8000,
      });
    } else if (interval === "year" && currentPlan.includes("monthly")) {
      // Monthly to Yearly
      toast({
        title: "🎉 Congratulations! Annual Savings Activated!",
        description: `You've switched to our annual plan! You'll continue with your monthly plan until the cycle ends, then your annual subscription (${amount}/year) begins and renews automatically until cancelled.`,
        duration: 8000,
      });
    } else if (
      newPlan === "leadertalk_starter" &&
      currentPlan.includes("exec")
    ) {
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

  const getSubscriptionChangePreview = async (plan: BillingProduct) => {
    try {
      const response = await fetch('/api/billing/subscription/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripePriceId: plan.pricing.stripePriceId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get subscription preview');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting subscription preview:', error);
      throw error;
    }
  };

  const handleSubscribe = async (plan: BillingProduct) => {
    const priceId = plan.pricing?.stripePriceId;
    if (!priceId) {
      console.error("❌ No price ID found for plan:", plan);
      return;
    }

    const currentPriceId = currentSubscription?.subscription?.priceId;
    const isCurrentPlan = currentPriceId === priceId;
    
    if (isCurrentPlan) {
      return; // Don't proceed if already on this plan
    }

    try {
      // Get subscription change preview from API
      const preview = await getSubscriptionChangePreview(plan);
      
      // Check if there are scheduled changes blocking this operation
      if (preview.error === 'SCHEDULED_CHANGE_EXISTS' || preview.hasScheduledChanges) {
        toast({
          variant: "destructive",
          title: "Subscription Change Blocked",
          description: preview.description,
          duration: 8000,
        });
        return;
      }
      
      // Set pending subscription change with preview data
      setPendingSubscriptionChange({ 
        plan, 
        priceId, 
        changeType: preview.changeType,
        warningMessage: preview.description 
      });
      
      setShowPaymentMethodSelector(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get subscription preview. Please try again.",
      });
    }
  };

  const confirmSubscriptionChange = async () => {
    if (!pendingSubscriptionChange) return;

    const { plan, priceId, changeType } = pendingSubscriptionChange;
    
    try {
      const response = await fetch('/api/billing/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stripePriceId: priceId,
          changeType,
          paymentMethodId: selectedPaymentMethodId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors specifically
        if (result.error && result.error.includes('scheduled change')) {
          toast({
            variant: "destructive",
            title: "Subscription Change Blocked",
            description: result.error,
            duration: 8000,
          });
          return;
        }
        throw new Error(result.error || 'Failed to update subscription');
      }

      if (result.success) {
        await refetchSubscription();
        
        // Show appropriate success message based on change type
        if (changeType === 'upgrade') {
          toast({
            title: "Upgrade Complete!",
            description: "Your subscription has been upgraded and new features are now available.",
            duration: 5000,
          });
        } else if (changeType === 'downgrade') {
          toast({
            title: "Downgrade Scheduled",
            description: result.message || "Your downgrade has been scheduled for the end of your billing period.",
            duration: 5000,
          });
        } else {
          toast({
            title: "Subscription Updated",
            description: "Your subscription has been updated successfully.",
            duration: 5000,
          });
        }
        
        // Clear pending state
        setPendingSubscriptionChange(null);
        setShowPaymentMethodSelector(false);
        setSelectedPaymentMethodId(undefined);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Subscription Update Failed",
        description: error.message || "Failed to update subscription. Please try again.",
        duration: 5000,
      });
    }
  };

  const cancelSubscriptionChange = () => {
    setPendingSubscriptionChange(null);
    setShowPaymentMethodSelector(false);
    setSelectedPaymentMethodId(undefined);
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
    <div className="page-layout">
      <div className="page-content">
        <div className="text-center space-y-md">
          <h1 className="text-foreground">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Upgrade your leadership training with premium features and increased
            word limits
          </p>
        </div>

        {/* Current Subscription Status */}
      {currentSubscription?.hasSubscription && currentSubscription.subscription && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Current Subscription
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  You're subscribed to {currentSubscription.subscription.plan}
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary border-primary/30"
              >
                {currentSubscription.subscription.formattedStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="font-medium text-muted-foreground mb-2">Word Usage</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentSubscription.subscription.formattedUsage}
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium text-muted-foreground mb-2">Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentSubscription.subscription.formattedAmount}
                  {currentSubscription.subscription.formattedInterval}
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium text-muted-foreground mb-2">Next Billing</p>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.subscription.formattedNextRenewal}
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium text-muted-foreground mb-2">Subscription Created</p>
                <p className="text-sm text-muted-foreground">
                  You first subscribed on{" "}
                  {currentSubscription.subscription.formattedStartDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Subscription Changes */}
      {scheduledChanges && Array.isArray(scheduledChanges) && scheduledChanges.length > 0 && (
        <Card className="bg-card border-yellow-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Clock className="h-5 w-5" />
              <span>Scheduled Subscription Change</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your subscription will automatically change at the end of your current billing period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduledChanges.map((change: any, index: number) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Changing to: <span className="text-primary">{change.scheduledPlan || 'New Plan'}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Effective: {new Date(change.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelScheduledChange(change.id)}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    Cancel Change
                  </Button>
                </div>
                
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-700 dark:text-yellow-300 text-sm">
                  This change will take effect at the end of your current billing period. You'll keep all current features until then.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Plan</p>
                    <p className="text-foreground font-medium">
                      {change.currentPlan || 'Current Plan'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="text-foreground font-medium capitalize">
                      {change.status || 'Scheduled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Schedule ID</p>
                    <p className="text-foreground font-medium font-mono text-xs">
                      {change.id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

        {/* Available Plans */}
        <div className="responsive-grid">
        {plans?.map((plan) => (
          <Card
            key={plan.id}
            className={`card-layout glass-card ${
              selectedPlan?.id === plan.id ? "ring-2 ring-primary" : ""
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
                  <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                </div>
                {plan.isPopular && <Badge variant="default">Popular</Badge>}
              </div>
              <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="card-content">
              <div className="space-y-md">
                {/* Pricing */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {plan.pricing.formattedPrice}
                  </div>
                  {plan.pricing.formattedSavings && (
                    <div className="text-sm text-green-400 font-medium mt-1">
                      {plan.pricing.formattedSavings}
                    </div>
                  )}
                </div>

                <Separator className="bg-border" />

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-muted-foreground">
                      {plan.features.wordLimit.toLocaleString()} words/month
                    </span>
                  </div>
                  {plan.features.advancedAnalytics && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-muted-foreground">Advanced analytics</span>
                    </div>
                  )}
                  {plan.features.prioritySupport && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-muted-foreground">Priority support</span>
                    </div>
                  )}
                  {plan.billingType === "yearly" && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-primary font-medium">
                        Best value option
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Button anchored to bottom */}
              {(() => {
                const currentPriceId =
                  currentSubscription?.subscription?.priceId;
                const planPriceId = plan.pricing?.stripePriceId;
                const isCurrentPlan = currentPriceId === planPriceId;

                return (
                  <Button
                    className="w-full mt-auto"
                    onClick={() => handleSubscribe(plan)}
                    disabled={updateSubscription.isPending || isCurrentPlan}
                    variant={isCurrentPlan ? "secondary" : "default"}
                    size="lg"
                  >
                    {updateSubscription.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      isCurrentPlan ? "Current Plan" : "Select Plan"
                    )}
                  </Button>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method Selection - Only shown during subscription changes */}
      {showPaymentMethodSelector && pendingSubscriptionChange && (
        <div className="space-y-6">
          {/* Subscription Change Header */}
          <Card className="bg-card border-border backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Info className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <CardTitle className="text-foreground">
                Confirm Subscription Change
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Review the details below and confirm your subscription change
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Plan Change Summary */}
              <div className="bg-accent border border-border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Changing to:</span>
                  <span className="font-semibold text-foreground">{pendingSubscriptionChange.plan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Plan type:</span>
                  <span className="text-primary font-medium">{pendingSubscriptionChange.changeType}</span>
                </div>
              </div>
              
              {pendingSubscriptionChange.warningMessage && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-200 text-sm">
                    {pendingSubscriptionChange.warningMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            onPaymentMethodSelected={(paymentMethodId) => {
              setSelectedPaymentMethodId(paymentMethodId);
            }}
            selectedPaymentMethodId={selectedPaymentMethodId}
            showAddNewOption={true}
            immediateCharge={pendingSubscriptionChange?.warningMessage?.includes('$') ? 
              parseFloat(pendingSubscriptionChange.warningMessage.match(/\$(\d+(?:\.\d{2})?)/)?.[1] || '0') : 0}
            warningMessage={pendingSubscriptionChange?.warningMessage}
          />
          
          {/* Action Buttons */}
          <Card className="bg-card border-border backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button
                  onClick={confirmSubscriptionChange}
                  disabled={updateSubscription.isPending}
                  className="w-full"
                  size="lg"
                >
                  {updateSubscription.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Subscription Change"
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={cancelSubscriptionChange}
                  disabled={updateSubscription.isPending}
                  className="w-full"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Setup Form */}
      {paymentSetup && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret: paymentSetup.clientSecret }}
        >
          <PaymentSetupForm
            clientSecret={paymentSetup.clientSecret}
            originalRequest={paymentSetup.originalRequest}
            onSuccess={() => {
              setPaymentSetup(null);
              queryClient.invalidateQueries({
                queryKey: ["/api/billing/subscriptions/current"],
              });
            }}
          />
        </Elements>
      )}



      {/* Security Notice */}
      <Card className="border-gray-600 bg-gray-800/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium text-white">Secure Payment Processing</p>
          </div>
          <p className="text-gray-300 text-sm mt-1">
            All payments are processed securely through our payment provider. Your payment
            information is never stored on our servers.
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
                Are you sure you want to cancel your Executive subscription?
                This action cannot be undone.
              </div>
              <div className="mt-4">
                <strong>What happens next:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    You'll continue to enjoy all Executive features until{" "}
                    {currentSubscription?.subscription?.formattedNextRenewal}
                  </li>
                  <li>
                    After that, your account will automatically switch to the
                    free Starter plan
                  </li>
                  <li>
                    No refunds will be provided for the current billing period
                  </li>
                  <li>
                    You can resubscribe at any time to regain Executive access
                  </li>
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
              {cancelSubscription.isPending
                ? "Cancelling..."
                : "Yes, Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
