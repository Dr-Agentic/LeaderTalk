import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loadStripe } from '@stripe/stripe-js';
import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Load Stripe outside of component render
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Define types for Stripe products
interface StripePrice {
  id: string;
  unit_amount: number;
  recurring: {
    interval: string;
  };
  currency: string;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  prices: StripePrice[];
  images?: string[];
}

interface StripeProductsResponse {
  success: boolean;
  products: StripeProduct[];
  source: 'stripe' | 'database';
}

// Define interface for subscription data
interface SubscriptionResponse {
  success: boolean;
  subscription: {
    id?: string;
    status: string;
    plan: string;
    planId?: string;
    isFree: boolean;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    amount?: number;
    currency?: string;
    interval?: string;
    productImage?: string | null;
  };
}

// Payment form component
const CheckoutForm = ({ onSuccess = () => {} }: { onSuccess?: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  // Handle element ready state
  const handleReady = () => {
    setPaymentElementReady(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !paymentElementReady) {
      toast({
        title: "Payment not ready",
        description: "Please wait for the payment form to load completely",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your subscription has been updated",
        });
        onSuccess();
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Complete your payment information below</p>
      </div>
      
      <div className="border rounded-md p-4 mb-6 bg-muted/30">
        <PaymentElement 
          className="mb-3" 
          onReady={handleReady}
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            }
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || !paymentElementReady} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : !paymentElementReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Payment Form...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>
    </form>
  );
};

// Main subscription component
export default function SubscriptionNew() {
  const { userData } = useAuth();
  const [location, navigate] = useLocation();
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<StripeProduct | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(5);
  const { toast } = useToast();
  
  // Check for success parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('success') === 'true') {
      setSubscriptionSuccess(true);
      
      // Auto redirect to dashboard after countdown
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(timer);
            navigate('/dashboard');
          }
          return newCount;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [navigate]);

  // Get current subscription details
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<SubscriptionResponse>({
    queryKey: ["/api/current-subscription"],
    enabled: !!userData // Only run if user is logged in
  });

  // Get Stripe products
  const { data, isLoading, error } = useQuery<StripeProductsResponse>({
    queryKey: ["/api/stripe-products"],
  });

  // Create subscription mutation
  const createSubscription = async (price: StripePrice, product: StripeProduct) => {
    try {
      setSelectedPriceId(price.id);
      setSelectedPlan(product);
      
      toast({
        title: "Plan Selected",
        description: `You've selected the ${product.name} plan.`,
      });
      
      try {
        // Only attempt to get a client secret if we have valid Stripe keys
        if (stripePromise) {
          toast({
            title: "Processing",
            description: "Setting up payment details...",
          });
          
          const response = await apiRequest("POST", "/api/create-stripe-subscription", { priceId: price.id });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create subscription");
          }
          
          const data = await response.json();
          
          if (data.success && data.clientSecret) {
            console.log("Received client secret, setting up checkout form");
            setClientSecret(data.clientSecret);
          } else {
            throw new Error(data.error || "No client secret returned");
          }
        }
      } catch (error: any) {
        console.error("Subscription error:", error);
        toast({
          title: "Subscription Error",
          description: error.message || "Could not initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      toast({
        title: "Selection Failed",
        description: "Could not select this plan. Please try again.",
        variant: "destructive",
      });
      setSelectedPriceId("");
      setSelectedPlan(null);
    }
  };

  // Success page content
  if (subscriptionSuccess) {
    return (
      <AppLayout
        showBackButton={false}
        pageTitle="Subscription Confirmed"
      >
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Subscription Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your subscription. Your payment was successful.
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="text-center mb-4">
                <p className="mb-2">You will be redirected to the dashboard in:</p>
                <p className="text-3xl font-bold text-primary">{redirectCountdown}</p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Main selection page content
  return (
    <AppLayout
      showBackButton={true}
      backTo="/settings"
      backLabel="Back to Settings"
      pageTitle="Subscription Management"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing details
        </p>
      </div>

      {/* Current Subscription Summary */}
      {userData && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Your Current Plan</CardTitle>
              {subscriptionData?.success && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  subscriptionData.subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {subscriptionData.subscription.status.charAt(0).toUpperCase() + 
                  subscriptionData.subscription.status.slice(1)}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-4 items-center mb-4">
              {subscriptionData?.success && subscriptionData.subscription.productImage && (
                <div className="w-12 h-12 flex-shrink-0">
                  <img 
                    src={subscriptionData.subscription.productImage} 
                    alt={`${subscriptionData.subscription.plan} plan`}
                    className="h-full w-auto object-contain"
                  />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold capitalize">
                  {(subscriptionData?.success && subscriptionData.subscription.plan) || 
                   userData.subscriptionPlan || "Starter"} Plan
                </h3>
                {!subscriptionData?.success?.subscription?.isFree && 
                 subscriptionData?.success?.subscription?.amount && (
                  <p className="text-muted-foreground">
                    ${subscriptionData.subscription.amount.toFixed(2)}/
                    {subscriptionData.subscription.interval || 'month'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Subscription Details Section */}
            <div className="p-3 mt-2 rounded-md bg-muted/30">
              <p className="text-sm font-medium mb-2">Subscription Details</p>
              <div className="space-y-2 text-sm">
                {/* Word Limit */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Word Limit:</span>
                  <span className="font-medium">
                    {userData.subscriptionPlan === 'starter' ? '5,000' : 
                     userData.subscriptionPlan === 'pro' ? '15,000' : 
                     userData.subscriptionPlan === 'executive' ? '50,000' : '5,000'} words/month
                  </span>
                </div>
                
                {/* Billing Cycle */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle:</span>
                  <span className="font-medium">
                    {subscriptionData?.success && subscriptionData.subscription.currentPeriodEnd ? (
                      <span>
                        {subscriptionData.subscription.currentPeriodStart ? 
                          new Date(subscriptionData.subscription.currentPeriodStart).toLocaleDateString() : ''} - {' '}
                        {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    ) : userData.nextBillingDate ? (
                      <span>Until {new Date(userData.nextBillingDate).toLocaleDateString()}</span>
                    ) : (
                      <span>Monthly</span>
                    )}
                  </span>
                </div>
                
                {/* Next Renewal */}
                {(subscriptionData?.success && subscriptionData.subscription.currentPeriodEnd) || userData.nextBillingDate ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Renewal:</span>
                    <span className="font-medium">
                      {subscriptionData?.success && subscriptionData.subscription.currentPeriodEnd ? 
                        new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString() :
                        userData.nextBillingDate ? 
                          new Date(userData.nextBillingDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ) : null}
                
                {/* Subscription ID */}
                {subscriptionData?.success && subscriptionData.subscription.id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subscription ID:</span>
                    <span className="font-medium text-xs opacity-70">
                      {subscriptionData.subscription.id.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Choose Your Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div>
              <Alert className="mb-6">
                <AlertTitle>Subscription Service Unavailable</AlertTitle>
                <AlertDescription>
                  We couldn't connect to our payment service. Here are our subscription plans:
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    id: "starter",
                    name: "Starter",
                    description: "Perfect for exploring LeaderTalk's capabilities",
                    price: 0,
                    interval: "month",
                    features: ["5,000 words per month", "Basic analysis", "1 leader model"]
                  },
                  {
                    id: "pro",
                    name: "Pro",
                    description: "Ideal for regular users who want enhanced capabilities",
                    price: 9.99,
                    interval: "month",
                    features: ["15,000 words per month", "Detailed analysis", "Up to 3 leader models", "Priority support"]
                  },
                  {
                    id: "executive",
                    name: "Executive",
                    description: "For professionals who need comprehensive solutions",
                    price: 29.99,
                    interval: "month",
                    features: ["50,000 words per month", "Premium analytics", "Unlimited leader models", "24/7 priority support"]
                  }
                ].map(plan => (
                  <Card key={plan.id} className="overflow-hidden border-2 border-border relative">
                    {plan.name === "Pro" && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-md">
                        Popular
                      </div>
                    )}
                    <CardHeader className="bg-muted/50 pb-4">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="mt-1">
                        <span className="text-2xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/{plan.interval}</span>
                        {plan.name !== "Starter" && (
                          <div className="text-xs mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Monthly</span>
                              <div className="h-4 w-8 rounded-full bg-muted-foreground/20 flex items-center px-0.5">
                                <div className="h-3 w-3 rounded-full bg-primary"></div>
                              </div>
                              <span className="text-muted-foreground">Annual (save 16%)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm mb-4">{plan.description}</p>
                      <ul className="text-sm space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={plan.name === "Pro" ? "default" : "outline"}
                        onClick={() => {
                          if (plan.price > 0) {
                            toast({
                              title: `${plan.name} Plan Selected`,
                              description: "This plan is selected but Stripe payment is currently unavailable.",
                              duration: 5000
                            });
                          }
                        }}
                      >
                        {plan.price === 0 ? 'Current Plan' : `Select ${plan.name} Plan`}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : data && data.products && data.products.length > 0 ? (
            selectedPlan && clientSecret && stripePromise ? (
              <div className="max-w-md mx-auto">
                <h3 className="font-medium text-lg mb-4">Selected Plan Details</h3>
                
                <div className="rounded-lg border p-6 mb-6 bg-card">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">{selectedPlan.name}</h4>
                    {selectedPlan.prices[0]?.unit_amount && (
                      <div className="text-lg font-bold">
                        ${(selectedPlan.prices[0].unit_amount / 100).toFixed(2)}
                        <span className="text-sm text-muted-foreground ml-1">
                          /{selectedPlan.prices[0].recurring?.interval || 'month'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">{selectedPlan.description}</p>
                  </div>
                  
                  <Separator className="my-4" />
                  <h4 className="font-medium mb-4">Complete Your Payment</h4>
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0070f3',
                        },
                      }
                    }}
                  >
                    <CheckoutForm />
                  </Elements>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setSelectedPlan(null);
                    setSelectedPriceId("");
                    setClientSecret("");
                  }}
                >
                  Back to Plan Selection
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {data.products.map(product => {
                  // Skip products with no prices
                  if (!product.prices || product.prices.length === 0) return null;
                  
                  // Get monthly and yearly prices
                  const monthlyPrice = product.prices.find(p => p.recurring?.interval === 'month');
                  const yearlyPrice = product.prices.find(p => p.recurring?.interval === 'year');
                  
                  // Skip products with no valid prices
                  if (!monthlyPrice && !yearlyPrice) return null;
                  
                  const isPopular = product.name.toLowerCase().includes('pro');
                  
                  // For each product, create cards for both monthly and yearly options if available
                  const priceOptions = [];
                  
                  if (monthlyPrice) {
                    const monthlyAmount = monthlyPrice.unit_amount / 100;
                    priceOptions.push({
                      id: monthlyPrice.id,
                      interval: 'month',
                      amount: monthlyAmount,
                      displayAmount: `$${monthlyAmount.toFixed(2)}/month`,
                      priceObj: monthlyPrice
                    });
                  }
                  
                  if (yearlyPrice) {
                    const yearlyAmount = yearlyPrice.unit_amount / 100;
                    const monthlyEquivalent = yearlyAmount / 12;
                    // Calculate percentage savings compared to monthly
                    const savingsPercent = monthlyPrice ? 
                      Math.round(100 - ((yearlyAmount / 12) / (monthlyPrice.unit_amount / 100) * 100)) : 0;
                    
                    priceOptions.push({
                      id: yearlyPrice.id,
                      interval: 'year',
                      amount: yearlyAmount,
                      displayAmount: `$${yearlyAmount.toFixed(2)}/year`,
                      monthlyEquivalent: `$${monthlyEquivalent.toFixed(2)}/month`,
                      savings: savingsPercent > 0 ? `Save ${savingsPercent}%` : '',
                      priceObj: yearlyPrice
                    });
                  }
                  
                  return (
                    <Card key={product.id} className={`overflow-hidden border-2 border-border relative`}>
                      {isPopular && (
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-md">
                          Popular
                        </div>
                      )}
                      <CardHeader className="bg-muted/50 pb-4">
                        {product.images && product.images.length > 0 && (
                          <div className="flex justify-center mb-3">
                            <img 
                              src={product.images[0]} 
                              alt={`${product.name} plan`} 
                              className="h-12 w-auto object-contain"
                            />
                          </div>
                        )}
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm mt-1 mb-2">{product.description}</p>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {priceOptions.map((option) => (
                            <div 
                              key={option.id} 
                              className={`p-3 rounded-lg border-2 ${selectedPriceId === option.id ? 'border-primary' : 'border-muted'}`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{option.interval === 'month' ? 'Monthly' : 'Annual'}</span>
                                {option.savings && (
                                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                                    {option.savings}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-lg">{option.displayAmount}</div>
                              {option.monthlyEquivalent && (
                                <div className="text-xs text-muted-foreground">{option.monthlyEquivalent} billed annually</div>
                              )}
                              <Button 
                                className="w-full mt-3" 
                                variant={isPopular ? "default" : "outline"}
                                size="sm"
                                onClick={() => createSubscription(option.priceObj, product)}
                              >
                                Select
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            <div>
              <Alert className="mb-6">
                <AlertTitle>No Subscription Plans Available</AlertTitle>
                <AlertDescription>
                  We couldn't find any subscription plans at this time. Please try again later.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground mt-6">
        <p className="max-w-2xl">
          <strong>Note about subscription changes:</strong> When upgrading your subscription, the new word limit will apply immediately.
          When downgrading, the change will take effect at the end of your current billing period.
          We cannot offer refunds for unused portions of your subscription.
        </p>
      </div>
    </AppLayout>
  );
}