import { useEffect } from "react";
import { Link } from "wouter";
import StripeProductsView from "@/components/subscription/StripeProductsView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StripeProducts() {
  // Set page title
  useEffect(() => {
    document.title = "Subscription Plans - LeaderTalk";
  }, []);

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Choose a subscription plan that fits your leadership development needs
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline">Back to Settings</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <StripeProductsView />
        </CardContent>
      </Card>
    </div>
  );
}