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
import SubscriptionTimeline from "@/components/subscription/SubscriptionTimeline";

// Load Stripe outside of component render
// Ensure we have a valid Stripe key before initializing
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log("Initializing Stripe with key:", stripeKey ? "Key exists" : "No key found");
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
}

interface StripeProductsResponse {
  success: boolean;
  products: StripeProduct[];
  source: 'stripe' | 'database';
}

// Payment form component
const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
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
          onLoadError={(event) => {
            console.log("Payment element error:", event);
            toast({
              title: "Payment Form Error",
              description: `Error loading payment form: ${event.error.message}`,
              variant: "destructive"
            });
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

export default function Subscription() {
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
  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/current-subscription"],
  });
  
  // Debug current subscription data
  useEffect(() => {
    if (subscriptionData) {
      console.log("Current subscription data:", subscriptionData);
      console.log("Subscription success state:", subscriptionSuccess);
      console.log("Has success property:", subscriptionData?.success);
    }
  }, [subscriptionData, subscriptionSuccess]);
  
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
        // Don't show error toast, just display plan details
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

  return (
    <AppLayout
      showBackButton={!subscriptionSuccess}
      backTo="/settings"
      backLabel="Back to Settings"
      pageTitle={subscriptionSuccess ? "Subscription Confirmed" : "Subscription Management"}
    >
      {subscriptionSuccess ? (
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
      ) : (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and billing details
          </p>
        </div>
      )}

      {/* Debug section is now hidden in production */}

      {!subscriptionSuccess && (
        <div>
          {/* Current Subscription Information */}
          {subscriptionData?.success && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold tracking-tight mb-4">Current Subscription</h2>
              <SubscriptionTimeline data={subscriptionData} className="mb-4" />
            </div>
          )}
          
          {/* Plan Selection */}
          <div className="mt-10 pt-6 border-t border-border">
            <h2 className="text-xl font-semibold tracking-tight mb-4">Change Subscription Plan</h2>
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
                    features: ["500 words per month", "Basic analysis", "1 leader model"]
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
          ) : selectedPlan ? (
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
                
                {clientSecret && stripePromise ? (
                  <>
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
                            fontFamily: 'system-ui, sans-serif',
                            borderRadius: '8px',
                          }
                        }
                      }}
                    >
                      <CheckoutForm onSuccess={() => {
                        setClientSecret("");
                        setSelectedPriceId("");
                        setSelectedPlan(null);
                      }} />
                    </Elements>
                    
                    <div className="mt-6 text-sm text-muted-foreground">
                      <p>Having trouble with payment? Please ensure your payment method is valid.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Alert className="mb-4">
                      <AlertTitle>Subscription Not Available</AlertTitle>
                      <AlertDescription>
                        The payment system is currently unavailable. Please try again later or contact support.
                      </AlertDescription>
                    </Alert>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      Subscription details will be stored in your account once payment is complete.
                    </p>
                  </>
                )}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setClientSecret("");
                  setSelectedPriceId("");
                  setSelectedPlan(null);
                }}
              >
                Back to Plan Selection
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {data?.products.filter(p => p.active && p.prices.length > 0).map(product => {
                const price = product.prices[0];
                const isMonthly = price.recurring?.interval === 'month';
                const amount = price.unit_amount / 100;
                
                return (
                  <Card key={product.id} className={`overflow-hidden border-2 ${selectedPriceId === price.id ? 'border-primary' : 'border-border'}`}>
                    <CardHeader className="bg-muted/50 pb-4">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="mt-1">
                        <span className="text-2xl font-bold">${amount}</span>
                        <span className="text-muted-foreground">/{isMonthly ? 'month' : 'year'}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm mb-4">{product.description}</p>
                      <Button 
                        className="w-full" 
                        onClick={() => createSubscription(price, product)}
                      >
                        Select Plan
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
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