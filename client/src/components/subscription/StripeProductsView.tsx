import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Determine if Stripe is available
const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;
let stripePromise: any = null;
if (isStripeAvailable) {
  stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
}

// Types for Stripe products and prices
interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
    interval_count: number;
  } | null;
  nickname: string | null;
  metadata: Record<string, string>;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, string>;
  prices: StripePrice[];
}

interface StripeProductsResponse {
  success: boolean;
  products: StripeProduct[];
  error?: string;
}

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription?success=true`,
      },
      redirect: 'if_required',
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </span>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

export default function StripeProductsView() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Fetch Stripe products and prices
  const { data, isLoading, error } = useQuery<StripeProductsResponse>({
    queryKey: ["/api/stripe-products"],
    enabled: isStripeAvailable,
  });
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-stripe-subscription", { priceId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not create subscription",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSelectPrice = (priceId: string) => {
    setSelectedPriceId(priceId);
    setClientSecret(null);
  };
  
  const handleProceedToPayment = () => {
    if (selectedPriceId) {
      createSubscriptionMutation.mutate(selectedPriceId);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    refreshUserData();
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
  
  if (error || !data) {
    return (
      <Alert className="bg-destructive/10 border-destructive">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle>Error Loading Plans</AlertTitle>
        <AlertDescription>
          Could not load subscription plans from Stripe. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredProducts = data.products.filter(p => p.active && p.prices.length > 0);
  
  // Determine if showing plan selection or payment form
  const isSelectingPlan = !clientSecret;
  
  if (isSelectingPlan) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Stripe Products & Plans</h3>
          <p className="text-muted-foreground">
            Choose a subscription plan that best fits your needs. All plans include access to AI-powered communication coaching.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {filteredProducts.map((product) => {
            // Get the monthly price if available
            const monthlyPrice = product.prices.find(p => p.recurring?.interval === 'month');
            const yearlyPrice = product.prices.find(p => p.recurring?.interval === 'year');
            
            // Skip if no valid price
            if (!monthlyPrice && !yearlyPrice) return null;
            
            // Default to monthly, fallback to yearly price
            const price = monthlyPrice || yearlyPrice;
            if (!price) return null;
            
            const isSelected = selectedPriceId === price.id;
            const wordLimit = product.metadata?.word_limit ? parseInt(product.metadata.word_limit, 10) : 0;
            
            // Try to extract features from metadata
            const features = [];
            if (wordLimit) {
              features.push(`${wordLimit.toLocaleString()} words per month`);
            }
            
            // Add any additional features from metadata
            for (let i = 1; i <= 5; i++) {
              const feature = product.metadata[`feature_${i}`];
              if (feature) features.push(feature);
            }
            
            return (
              <Card 
                key={product.id}
                className={`border-2 ${isSelected ? 'border-primary' : 'border-border'} cursor-pointer transition-all hover:border-primary/70`}
                onClick={() => handleSelectPrice(price.id)}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    {product.name}
                    {isSelected && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </CardTitle>
                  <CardDescription>
                    {product.description}
                  </CardDescription>
                  <div className="text-3xl font-bold mt-2">
                    ${(price.unit_amount / 100).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      /{price.recurring?.interval || 'month'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={isSelected ? "default" : "outline"} 
                    className="w-full"
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleProceedToPayment} 
            disabled={!selectedPriceId || createSubscriptionMutation.isPending}
            size="lg"
          >
            {createSubscriptionMutation.isPending ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </span>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  // Payment form with Stripe Elements
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-4">Complete Your Subscription</h3>
      <Elements stripe={stripePromise} options={{ clientSecret: clientSecret! }}>
        <CheckoutForm onSuccess={handlePaymentSuccess} />
      </Elements>
      <div className="text-sm text-muted-foreground mt-4">
        Your payment information is securely processed by Stripe. We do not store your card details.
      </div>
    </div>
  );
}