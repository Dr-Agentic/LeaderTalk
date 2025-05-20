import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Load Stripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// Check if Stripe is available
const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

type PlanDetails = {
  id: number;
  planCode: string;
  name: string;
  monthlyPriceUsd: string;
  monthlyWordLimit: number;
  features: string[];
};

interface PlansResponse {
  success: boolean;
  plans: PlanDetails[];
}

function CheckoutForm({ planCode }: { planCode: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "succeeded" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsSubmitting(true);
    setPaymentStatus("processing");
    
    // Confirm payment with Stripe.js
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription-success`,
      },
      redirect: "if_required",
    });
    
    if (error) {
      setErrorMessage(error.message || "An error occurred with your payment");
      setPaymentStatus("error");
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred with your payment",
        variant: "destructive",
      });
    } else if (paymentIntent?.status === "succeeded") {
      setPaymentStatus("succeeded");
      toast({
        title: "Payment Successful",
        description: "Your subscription has been processed successfully!",
      });
      
      // Invalidate relevant queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    }
    
    setIsSubmitting(false);
  };
  
  // Show different UI based on payment status
  if (paymentStatus === "succeeded") {
    return (
      <Alert className="bg-success/10 border-success mb-4">
        <CheckCircle className="h-5 w-5 text-success" />
        <AlertTitle>Payment Successful</AlertTitle>
        <AlertDescription>
          Your subscription has been activated. Thank you for your purchase!
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <Alert className="bg-destructive/10 border-destructive mb-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isSubmitting} 
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
}

export default function StripeSubscription() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Fetch available subscription plans
  const { data: plansData, isLoading, error } = useQuery<PlansResponse>({
    queryKey: ["/api/subscription-plans"],
    enabled: isStripeAvailable,
  });
  
  // Extract plans from the API response, ensuring we properly handle the structure
  const plans = (plansData && Array.isArray(plansData.plans)) ? plansData.plans : [];
  
  interface SubscriptionResponse {
    success: boolean;
    clientSecret?: string;
    error?: string;
  }
  
  // Create payment intent mutation
  const createPaymentMutation = useMutation<SubscriptionResponse, Error, string>({
    mutationFn: async (planCode: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { planCode });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not create payment session",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Select user's current plan by default
  useEffect(() => {
    if (userData?.subscriptionPlan && !selectedPlan) {
      setSelectedPlan(userData.subscriptionPlan);
    }
  }, [userData, selectedPlan]);
  
  const handleSelectPlan = (planCode: string) => {
    setSelectedPlan(planCode);
    setClientSecret(null);
  };
  
  const handleProceedToPayment = () => {
    if (selectedPlan) {
      createPaymentMutation.mutate(selectedPlan);
    }
  };
  
  if (!isStripeAvailable) {
    return (
      <Alert className="bg-destructive/10 border-destructive">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle>Stripe is not configured</AlertTitle>
        <AlertDescription>
          Stripe payment processing is not available. Please contact the administrator.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  
  // Determine if showing plan selection or payment form
  const isSelectingPlan = !clientSecret;
  
  return (
    <div className="space-y-6">
      {isSelectingPlan ? (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Select a Subscription Plan</h3>
            <p className="text-muted-foreground">
              Choose the plan that works best for you. All plans include our core features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan: PlanDetails) => (
              <Card 
                key={plan.id} 
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.planCode 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleSelectPlan(plan.planCode)}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    ${parseFloat(plan.monthlyPriceUsd).toFixed(2)}/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-primary mr-2 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={selectedPlan === plan.planCode ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.planCode)}
                  >
                    {selectedPlan === plan.planCode ? "Selected" : "Select Plan"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleProceedToPayment} 
              disabled={!selectedPlan || createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </>
      ) : (
        <div>
          <h3 className="text-lg font-medium mb-4">Complete Your Payment</h3>
          <Elements 
            stripe={stripePromise} 
            options={{ clientSecret: clientSecret as string }}
          >
            <CheckoutForm planCode={selectedPlan} />
          </Elements>
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setClientSecret(null)}
          >
            Back to Plan Selection
          </Button>
        </div>
      )}
    </div>
  );
}