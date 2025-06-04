import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, LayoutDashboard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Format date to a readable format
function formatDate(date: string | Date | null) {
  if (!date) return 'Not available';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Calculate days between dates
function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function Subscription() {
  // Get current subscription details
  const { data: subscriptionData, isLoading, error } = useQuery({
    queryKey: ["/api/billing/subscriptions/current"],
  });

  if (isLoading) {
    return (
      <AppLayout
        showBackButton={true}
        backTo="/settings"
        backLabel="Back to Settings"
        pageTitle="Subscription Management"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-white">Loading subscription details...</span>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        showBackButton={true}
        backTo="/settings"
        backLabel="Back to Settings"
        pageTitle="Subscription Management"
      >
        <Alert variant="destructive">
          <AlertTitle>Could not load subscription</AlertTitle>
          <AlertDescription>
            Failed to load subscription details. Please try again later.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const subscription = subscriptionData?.subscription;

  return (
    <AppLayout
      showBackButton={true}
      backTo="/settings"
      backLabel="Back to Settings"
      pageTitle="Subscription Management"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Current Subscription Status */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                {/* Subscription start date */}
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Subscription Created</h4>
                    <p className="text-sm text-gray-300">
                      You first subscribed on <span className="font-medium">{formatDate(subscription.formattedStartDate || subscription.startDate)}</span>
                    </p>
                  </div>
                </div>
                
                {/* Current billing period */}
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Current Billing Cycle</h4>
                    <p className="text-sm text-gray-300">
                      {subscription.formattedCurrentPeriod || 'Current billing period information not available'}
                    </p>
                    {subscription.daysRemaining > 0 && (
                      <p className="text-xs mt-1 text-gray-400">
                        <span className="font-medium">{subscription.daysRemaining}</span> days remaining
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Plan information */}
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Plan Information</h4>
                    <p className="text-sm text-gray-300">
                      <span className="font-medium capitalize">{subscription.plan}</span> Plan
                      {subscription.formattedAmount && (
                        <> - {subscription.formattedAmount}/{subscription.formattedInterval}</>
                      )}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      <span className="font-medium">{subscription.wordLimit?.toLocaleString() || 'N/A'}</span> words per month
                    </p>
                    {subscription.cancelAtPeriodEnd && (
                      <p className="text-xs mt-1 text-red-400">
                        Your subscription will not renew after the current period ends
                      </p>
                    )}
                    <div className="mt-2">
                      <Badge variant={subscription.statusColor === 'green' ? 'default' : 'destructive'}>
                        {subscription.formattedStatus || subscription.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Usage information */}
                {subscription.currentUsage !== undefined && (
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">Usage This Period</h4>
                    <p className="text-sm text-gray-300">
                      {subscription.formattedUsage || `${subscription.currentUsage} words used`}
                    </p>
                    {subscription.usagePercentage !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(subscription.usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {subscription.usagePercentage.toFixed(1)}% of monthly limit used
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-300">No active subscription found</p>
                <p className="text-sm text-gray-400 mt-1">You may be on a free plan or need to set up billing</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Need to Change Your Plan?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              To upgrade, downgrade, or manage your subscription, please contact our support team.
            </p>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
              Contact Support
            </Button>
          </CardContent>
        </Card>

        <div className="text-sm text-gray-400 mt-6">
          <p className="max-w-2xl">
            <strong>Note about subscription changes:</strong> When upgrading your subscription, the new word limit will apply immediately.
            When downgrading, the change will take effect at the end of your current billing period.
            We cannot offer refunds for unused portions of your subscription.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}