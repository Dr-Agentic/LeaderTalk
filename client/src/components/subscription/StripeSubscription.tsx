import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Check if Stripe is available
const isStripeAvailable = !!(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionPlan {
  id: string;
  planCode: string;
  name: string;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
  wordLimit: number;
  features: string[];
  isPopular: boolean;
}

interface PlansResponse {
  plans: SubscriptionPlan[];
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
              Choose the plan that best fits your leadership training needs.
            </p>
          </div>
          
          <RadioGroup value={selectedPlan} onValueChange={handleSelectPlan}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all ${
                    selectedPlan === plan.planCode 
                      ? "ring-2 ring-primary" 
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => handleSelectPlan(plan.planCode)}
                >
                  {plan.isPopular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      ${plan.monthlyPriceUsd}
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <CardDescription>
                      {plan.wordLimit.toLocaleString()} words per month
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={plan.planCode} id={plan.planCode} />
                      <Label htmlFor={plan.planCode} className="sr-only">
                        Select {plan.name}
                      </Label>
                    </div>

                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={handleProceedToPayment}
              disabled={!selectedPlan || createPaymentMutation.isPending}
              size="lg"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p>Payment form would be displayed here with clientSecret: {clientSecret}</p>
        </div>
      )}
    </div>
  );
}