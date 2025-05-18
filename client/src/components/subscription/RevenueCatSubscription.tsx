import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { 
  getAvailableProducts, 
  purchasePackage, 
  checkSubscriptionStatus,
  restorePurchases
} from '@/lib/revenuecat';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@shared/schema';

interface SubscriptionPlan {
  id: number;
  name: string;
  planCode: string;
  monthlyWordLimit: number;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
  features: string[];
  isDefault: boolean;
}

export default function RevenueCatSubscription() {
  const { toast } = useToast();
  const auth = useAuth();
  const user = auth.userData as User | undefined;
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isSubscribed: false,
    plan: 'none',
  });

  // Get subscription plans from our database
  interface SubscriptionPlansResponse {
    plans: SubscriptionPlan[];
  }

  const { data: plansData, isLoading: isPlansLoading } = useQuery<SubscriptionPlansResponse>({
    queryKey: ['/api/subscription-plans']
  });
  
  const plans: SubscriptionPlan[] = plansData?.plans || [];

  // Fetch RevenueCat products when component mounts
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const packages = await getAvailableProducts();
        setAvailablePackages(packages);
        
        // Check current subscription status
        const status = await checkSubscriptionStatus();
        setSubscriptionStatus({
          isSubscribed: status.isSubscribed,
          plan: status.plan,
        });
        
        // If user has an active subscription, pre-select their current plan
        if (status.isSubscribed && status.plan !== 'none') {
          setSelectedPlan(status.plan);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription options. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id, toast]);

  // Mutation to update the user's subscription in our database
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (planCode: string) => {
      return apiRequest('POST', '/api/users/subscription', { planCode });
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your subscription. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle purchase
  const handlePurchase = async (planCode: string) => {
    try {
      setLoading(true);
      
      // Find the corresponding RevenueCat package
      const packageToPurchase = availablePackages.find(
        pkg => pkg.identifier.includes(planCode)
      );
      
      if (!packageToPurchase) {
        toast({
          title: 'Error',
          description: `Subscription plan "${planCode}" not available.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Process the purchase with RevenueCat
      const result = await purchasePackage(packageToPurchase);
      
      if (result.success) {
        // Update subscription in our database
        await updateSubscriptionMutation.mutateAsync(planCode);
        
        // Refresh subscription status
        const status = await checkSubscriptionStatus();
        setSubscriptionStatus({
          isSubscribed: status.isSubscribed,
          plan: status.plan,
        });
        
        setSelectedPlan(planCode);
        
        toast({
          title: 'Success!',
          description: 'Your subscription has been activated.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Purchase Failed',
          description: 'There was an error processing your payment. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during purchase:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const result = await restorePurchases();
      
      if (result.success) {
        // Check updated subscription status
        const status = await checkSubscriptionStatus();
        setSubscriptionStatus({
          isSubscribed: status.isSubscribed,
          plan: status.plan,
        });
        
        if (status.isSubscribed) {
          setSelectedPlan(status.plan);
          toast({
            title: 'Purchases Restored',
            description: 'Your subscription has been restored successfully.',
            variant: 'default',
          });
          
          // Update subscription in our database
          await updateSubscriptionMutation.mutateAsync(status.plan);
        } else {
          toast({
            title: 'No Purchases Found',
            description: 'No active subscriptions were found to restore.',
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Restore Failed',
          description: 'There was an error restoring your purchases. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isPlansLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading subscription options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Choose a plan that works for your leadership development needs
          </p>
        </div>
        <Button variant="outline" onClick={handleRestorePurchases} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Restore Purchases
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = subscriptionStatus.plan === plan.planCode;
          const isSelected = selectedPlan === plan.planCode;
          
          return (
            <Card 
              key={plan.id}
              className={`border-2 ${isSelected || isCurrentPlan ? 'border-primary' : 'border-border'}`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between">
                  {plan.name}
                  {isCurrentPlan && <CheckCircle className="h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>
                  {plan.monthlyWordLimit.toLocaleString()} words per month
                </CardDescription>
                <div className="text-3xl font-bold mt-2">
                  ${parseFloat(plan.monthlyPriceUsd).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={loading || isCurrentPlan}
                  onClick={() => handlePurchase(plan.planCode)}
                  variant={isCurrentPlan ? "outline" : "default"}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    "Select Plan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      <div className="text-sm text-muted-foreground mt-6">
        <p>
          You can cancel your subscription at any time through your account settings.
          Subscription will auto-renew unless canceled at least 24 hours before the end of the current period.
        </p>
      </div>
    </div>
  );
}