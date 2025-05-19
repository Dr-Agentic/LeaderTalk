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

  // Check if SDK is available
  const [sdkAvailable, setSdkAvailable] = useState<boolean>(false);
  const [sdkType, setSdkType] = useState<'web' | 'mobile' | 'none'>('none');
  
  // Check for SDK availability on mount
  useEffect(() => {
    if (window.RevenueCat) {
      setSdkAvailable(true);
      setSdkType('web');
      console.log('RevenueCat Web SDK detected');
    } else if (window.Purchases) {
      setSdkAvailable(true);
      setSdkType('mobile');
      console.log('RevenueCat Mobile SDK detected');
    } else {
      setSdkAvailable(false);
      setSdkType('none');
      console.log('No RevenueCat SDK detected');
    }
  }, []);
  
  // Initialize SDK and fetch products when available
  useEffect(() => {
    async function loadProducts() {
      try {
        if (!sdkAvailable) {
          console.error('RevenueCat SDK not available');
          return;
        }
        
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
    
    if (user?.id && sdkAvailable) {
      loadProducts();
    }
  }, [user?.id, sdkAvailable, toast]);

  // Mutation to update the user's subscription in our database
  const updateSubscriptionMutation = useMutation({
    mutationFn: (planCode: string) => {
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
      if (!sdkAvailable) {
        toast({
          title: 'Error',
          description: 'RevenueCat SDK is not available. Please try again later.',
          variant: 'destructive',
        });
        return;
      }
      
      setLoading(true);
      
      // Find the corresponding RevenueCat package
      const packageToPurchase = availablePackages.find(
        pkg => pkg.identifier?.includes(planCode) || pkg.product?.identifier?.includes(planCode)
      );
      
      if (!packageToPurchase) {
        toast({
          title: 'Error',
          description: `Subscription plan "${planCode}" not available.`,
          variant: 'destructive',
        });
        return;
      }
      
      console.log(`Using ${sdkType} SDK for purchase`, packageToPurchase);
      
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
          description: result.error?.message || 'There was an error processing your payment. Please try again.',
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
      if (!sdkAvailable) {
        toast({
          title: 'Error',
          description: 'RevenueCat SDK is not available. Please try again later.',
          variant: 'destructive',
        });
        return;
      }
      
      setLoading(true);
      console.log(`Using ${sdkType} SDK for restoring purchases`);
      
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
          description: result.error?.message || 'There was an error restoring your purchases. Please try again.',
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
      {!sdkAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-amber-800 font-medium">
              Payment system unavailable. Please check your connection and try again later.
            </span>
          </div>
          <p className="mt-2 text-sm text-amber-700 ml-7">
            The RevenueCat payment system is currently not available. This could be due to browser compatibility issues or network connectivity problems.
          </p>
        </div>
      )}

      {sdkAvailable && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">
              Payment system ready ({sdkType === 'web' ? 'Web' : 'Mobile'} SDK)
            </span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
          <p className="text-muted-foreground">
            Choose a plan that works for your leadership development needs
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRestorePurchases} 
          disabled={loading || !sdkAvailable}
        >
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
                  disabled={loading || isCurrentPlan || !sdkAvailable}
                  onClick={() => handlePurchase(plan.planCode)}
                  variant={isCurrentPlan ? "outline" : "default"}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : !sdkAvailable ? (
                    "Payment Unavailable"
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