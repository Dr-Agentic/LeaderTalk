import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
// Stripe is now handled entirely on the server for security

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
  source?: 'stripe' | 'database';
  note?: string;
}

// Removed insecure client-side payment processing
// All payment operations now handled securely on the server

export default function StripeProductsView() {
  const { userData, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  
  // Fetch Stripe products and prices
  const { data, isLoading, error } = useQuery<StripeProductsResponse>({
    queryKey: ["/api/stripe-products"],
    enabled: true,
  });
  
  // Create secure server-hosted checkout session
  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-checkout-session", { priceId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.checkoutUrl) {
        // Redirect to server-hosted Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not create checkout session",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSelectPrice = (priceId: string) => {
    setSelectedPriceId(priceId);
  };
  
  const handleProceedToPayment = () => {
    if (selectedPriceId) {
      createCheckoutMutation.mutate(selectedPriceId);
    }
  };
  
  // Check if we have valid subscription data
  if (!data && error) {
    return (
      <Alert className="bg-destructive/10 border-destructive">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle>Error Loading Plans</AlertTitle>
        <AlertDescription>
          Could not load subscription plans. Please contact support if this continues.
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
          Could not load subscription plans. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredProducts = data.products.filter(p => p.active && p.prices.length > 0);
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Subscription Plans</h3>
        <p className="text-muted-foreground">
          Choose a subscription plan that best fits your needs. All plans include access to AI-powered communication coaching.
        </p>
        {data?.source === 'database' && (
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <AlertDescription>
              <span className="font-semibold">Note:</span> Using plans from the LeaderTalk database. {data?.note}
            </AlertDescription>
          </Alert>
        )}
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
          
          // Try to extract word limit from metadata or product name/description
          let wordLimit = 0;
          if (product.metadata?.word_limit) {
            wordLimit = parseInt(product.metadata.word_limit, 10);
          } else if (product.description?.toLowerCase().includes('word')) {
            // Try to extract from description
            const match = product.description.match(/(\d{1,3}(?:,\d{3})*)\s*words/i);
            if (match) {
              wordLimit = parseInt(match[1].replace(/,/g, ''), 10);
            }
          } else if (product.name.toLowerCase().includes('starter')) {
            wordLimit = 5000; // Default word limits if we can guess from the name
          } else if (product.name.toLowerCase().includes('pro')) {
            wordLimit = 15000;
          } else if (product.name.toLowerCase().includes('executive')) {
            wordLimit = 50000;
          }
          
          // Try to extract features from metadata or build defaults
          const features = [];
          if (wordLimit) {
            features.push(`${wordLimit.toLocaleString()} words per month`);
          }
          
          // Try to read predefined features from metadata
          for (let i = 1; i <= 5; i++) {
            const feature = product.metadata[`feature_${i}`];
            if (feature) features.push(feature);
          }
          
          // Add default features based on plan level if none were found
          if (features.length <= 1) {
            if (product.name.toLowerCase().includes('starter')) {
              features.push('Basic communication analysis');
              features.push('Single leader inspiration');
              features.push('Email support');
            } else if (product.name.toLowerCase().includes('pro')) {
              features.push('Detailed communication analysis');
              features.push('Up to 2 leader inspirations');
              features.push('Email & chat support');
              features.push('Historical data insights');
            } else if (product.name.toLowerCase().includes('executive')) {
              features.push('Advanced communication analysis');
              features.push('Up to 3 leader inspirations');
              features.push('Priority email & chat support');
              features.push('Detailed historical insights');
              features.push('Executive coaching features');
            }
          }
          
          return (
            <Card 
              key={product.id}
              className={`border-2 ${isSelected ? 'border-primary' : 'border-border'} cursor-pointer transition-all hover:border-primary/70 relative overflow-hidden`}
              onClick={() => handleSelectPrice(price.id)}
            >
              {/* Add a recommended badge for the Pro plan */}
              {product.name.toLowerCase().includes('pro') && (
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-semibold transform translate-x-[15%] -translate-y-[15%] rotate-45">
                  Popular
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {product.name.replace('LeaderTalk ', '')}
                  {isSelected && <CheckCircle className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>
                  {product.description || `${wordLimit.toLocaleString()} words per ${price.recurring?.interval || 'month'}`}
                </CardDescription>
                <div className="text-3xl font-bold mt-2">
                  ${(price.unit_amount / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    /{price.recurring?.interval || 'month'}
                  </span>
                  {price.recurring?.interval === 'year' && (
                    <div className="text-sm font-normal text-green-600 mt-1">
                      Save {Math.round(100 - ((price.unit_amount / 12) / (monthlyPrice?.unit_amount || price.unit_amount) * 100))}% compared to monthly
                    </div>
                  )}
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
                  {isSelected ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      <div className="flex justify-end mt-8">
        <Button 
          onClick={handleProceedToPayment} 
          disabled={!selectedPriceId || createCheckoutMutation.isPending}
          size="lg"
        >
          {createCheckoutMutation.isPending ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating secure checkout...
            </span>
          ) : (
            'Proceed to Secure Checkout'
          )}
        </Button>
      </div>
    </div>
  );
}