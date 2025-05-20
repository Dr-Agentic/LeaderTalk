import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loadStripe } from '@stripe/stripe-js';
import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Load Stripe outside of component render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

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
        description: "Your subscription has been updated",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
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
  const [, navigate] = useLocation();
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const { toast } = useToast();

  // Get Stripe products
  const { data, isLoading, error } = useQuery<StripeProductsResponse>({
    queryKey: ["/api/stripe-products"],
  });

  // Create subscription mutation
  const createSubscription = async (priceId: string) => {
    try {
      setSelectedPriceId(priceId);
      
      toast({
        title: "Processing",
        description: "Setting up payment details...",
      });
      
      const response = await apiRequest("POST", "/api/create-stripe-subscription", { priceId });
      
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
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Could not set up payment process. Please try again.",
        variant: "destructive",
      });
      setSelectedPriceId("");
    }
  };

  return (
    <AppLayout
      showBackButton
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
            <Alert variant="destructive">
              <AlertDescription>
                Could not load subscription plans. Please try again later.
              </AlertDescription>
            </Alert>
          ) : clientSecret ? (
            <div className="max-w-md mx-auto">
              <h3 className="font-medium text-lg mb-4">Complete Your Payment</h3>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0070f3',
                    }
                  }
                }}
              >
                <CheckoutForm onSuccess={() => {
                  setClientSecret("");
                  setSelectedPriceId("");
                }} />
              </Elements>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  setClientSecret("");
                  setSelectedPriceId("");
                }}
              >
                Cancel and Select Different Plan
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
                        onClick={() => {
                          setSelectedPriceId(price.id);
                          createSubscription(price.id);
                        }}
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