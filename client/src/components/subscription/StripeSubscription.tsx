import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Initialize Stripe outside of the component to avoid re-creating
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionCardProps {
  id: number;
  name: string;
  planCode: string;
  monthlyWordLimit: number;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
  features: string[];
  onPlanSelect: (planCode: string) => void;
  currentPlan: string;
  isLoading: boolean;
}

const SubscriptionCard = ({ 
  name, 
  planCode, 
  monthlyWordLimit, 
  monthlyPriceUsd, 
  features, 
  onPlanSelect,
  currentPlan,
  isLoading
}: SubscriptionCardProps) => {
  const isCurrentPlan = currentPlan === planCode;
  
  return (
    <Card className={`w-full ${isCurrentPlan ? 'border-primary' : ''}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <CardDescription>
          <span className="text-2xl font-bold">${monthlyPriceUsd}</span>
          <span className="text-sm ml-1">/ month</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-medium">{monthlyWordLimit.toLocaleString()} words per month</p>
        <ul className="space-y-1 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onPlanSelect(planCode)} 
          variant={isCurrentPlan ? "outline" : "default"}
          disabled={isLoading || isCurrentPlan}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Payment form component
const CheckoutForm = ({ 
  clientSecret, 
  planCode,
  onSuccess,
  onCancel
}: { 
  clientSecret: string;
  planCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred with your payment');
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: "Payment Successful",
          description: `Your subscription to the ${planCode} plan has been activated.`,
        });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <PaymentElement />
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isLoading} 
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Subscribe to ${planCode}`
          )}
        </Button>
      </div>
    </form>
  );
};

export function StripeSubscription() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const { toast } = useToast();

  // Get subscription plans and user info
  const { data: plans } = useQuery({
    queryKey: ['/api/subscription-plans'],
  });

  const { data: user } = useQuery({
    queryKey: ['/api/users/me'],
  });

  // Get current user plan
  const currentPlan = user?.subscriptionPlan?.planCode || 'starter';

  // When user selects a plan, create a payment intent
  const handlePlanSelect = async (planCode: string) => {
    if (planCode === currentPlan) return;
    
    setSelectedPlan(planCode);
    setIsCreatingSubscription(true);
    
    try {
      const response = await apiRequest('POST', '/api/create-subscription', { planCode });
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.message || 'Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
      setSelectedPlan(null);
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setSelectedPlan(null);
    // Refresh user data to show updated subscription
    window.location.reload();
  };

  const handlePaymentCancel = () => {
    setClientSecret(null);
    setSelectedPlan(null);
  };

  // Show payment form if client secret is available
  if (clientSecret && selectedPlan) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Complete Subscription</h2>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            clientSecret={clientSecret} 
            planCode={selectedPlan} 
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </Elements>
      </div>
    );
  }

  // Show plan selection
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Select a Subscription Plan</h2>
      
      {!plans ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.plans && plans.plans.map((plan: any) => (
            <SubscriptionCard
              key={plan.id}
              {...plan}
              onPlanSelect={handlePlanSelect}
              currentPlan={currentPlan}
              isLoading={isCreatingSubscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StripeSubscription;