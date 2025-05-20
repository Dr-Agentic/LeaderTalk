import { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import RevenueCatSubscription from "@/components/subscription/RevenueCatSubscription";
import StripeSubscription from "@/components/subscription/StripeSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Subscription() {
  const { userData } = useAuth();
  const [, navigate] = useLocation();

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
          <CardTitle>Stripe Payment Integration</CardTitle>
          <CardDescription>
            Choose your subscription plan and pay securely with Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-2">
            <StripeSubscription />
          </div>
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