import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Calendar, Loader2, Clock, TimerReset, Clock3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function SubscriptionTimeline() {
  // Fetch subscription information
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/current-subscription'],
  });

  if (isLoading) {
    return <SubscriptionTimelineSkeleton />;
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Unable to load subscription details. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = data.subscription;
  
  // Default to current date if no start date is available
  const subscriptionStartDate = subscription.startDate ? new Date(subscription.startDate) : new Date();
  
  // Current billing period
  const currentPeriodStart = subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : new Date();
  const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date();
  
  // Calculate days remaining
  const today = new Date();
  const daysRemaining = getDaysBetween(today, currentPeriodEnd);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Original start date */}
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Subscription Start Date</h4>
              <p className="text-sm text-muted-foreground">
                You first subscribed on <span className="font-medium">{formatDate(subscriptionStartDate)}</span>
              </p>
            </div>
          </div>
          
          {/* Current billing period */}
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Current Billing Period</h4>
              <p className="text-sm text-muted-foreground">
                From <span className="font-medium">{formatDate(currentPeriodStart)}</span> to <span className="font-medium">{formatDate(currentPeriodEnd)}</span>
              </p>
            </div>
          </div>
          
          {/* Next renewal */}
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <TimerReset className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Next Renewal</h4>
              <p className="text-sm text-muted-foreground">
                Your subscription will renew on <span className="font-medium text-primary">{formatDate(currentPeriodEnd)}</span>
              </p>
              {daysRemaining > 0 && (
                <p className="text-xs mt-1">
                  <span className="font-medium">{daysRemaining}</span> days remaining
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
              <h4 className="text-sm font-medium">Plan Information</h4>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium capitalize">{subscription.plan}</span> Plan
                {!subscription.isFree && subscription.amount && (
                  <> - ${subscription.amount}/{subscription.interval || 'month'}</>
                )}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-xs mt-1 text-destructive-foreground">
                  Your subscription will not renew after the current period ends
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionTimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}