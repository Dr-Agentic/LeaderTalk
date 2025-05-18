import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import RevenueCatSubscription from "@/components/subscription/RevenueCatSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Subscription() {
  const { userData } = useAuth();
  const [, navigate] = useLocation();
  const [subscriptionMethod, setSubscriptionMethod] = useState<"standard" | "revenuecat">("standard");

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
          <CardTitle>Select Subscription Provider</CardTitle>
          <CardDescription>
            Choose how you would like to manage your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={subscriptionMethod}
            onValueChange={(value) => setSubscriptionMethod(value as "standard" | "revenuecat")}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="standard">Standard Billing</TabsTrigger>
              <TabsTrigger value="revenuecat">In-App Purchase</TabsTrigger>
            </TabsList>
            
            <TabsContent value="standard">
              <div className="py-2">
                <SubscriptionManager />
              </div>
            </TabsContent>
            
            <TabsContent value="revenuecat">
              <div className="py-2">
                <RevenueCatSubscription />
              </div>
            </TabsContent>
          </Tabs>
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