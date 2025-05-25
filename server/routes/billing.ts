import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { 
  getUserSubscription,
  createDefaultSubscription,
  ensureUserHasStripeCustomer
} from "../paymentServiceHandler";
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});
import { 
  getBillingProducts,
  getCurrentSubscriptionFormatted
} from "../subscriptionController";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerBillingRoutes(app: Express) {
  
  // GET /api/billing/products - Get all available subscription plans with server-side formatting
  app.get('/api/billing/products', getBillingProducts);

  // GET /api/billing/subscriptions/current - Get user's current subscription with formatting
  app.get('/api/billing/subscriptions/current', requireAuth, getCurrentSubscriptionFormatted);

  // POST /api/billing/subscriptions/create - Create a new subscription
  app.post('/api/billing/subscriptions/create', requireAuth, async (req, res) => {
    try {
      const { planCode, billingInterval = 'monthly' } = req.body;
      
      if (!planCode) {
        return res.status(400).json({ error: "Plan code is required" });
      }
      
      // Validate plan exists
      const plan = await storage.getSubscriptionPlanByCode(planCode);
      if (!plan) {
        return res.status(404).json({ error: "Invalid plan code" });
      }
      
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Ensure user has payment customer account
      const customerId = await ensureUserHasStripeCustomer(user);
      
      // Create subscription through payment handler (abstracts payment processor)
      const result = await createDefaultSubscription(customerId, plan.planCode);
      
      // Return clean billing response (no payment processor details)
      res.json({
        success: true,
        subscription: {
          id: result.id,
          status: result.status,
          planCode,
          billingInterval,
          startDate: result.startDate,
          nextBillingDate: result.nextBillingDate
        },
        checkoutUrl: result.checkoutUrl // For redirect to payment page
      });
      
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // POST /api/billing/subscriptions/cancel - Cancel current subscription
  app.post('/api/billing/subscriptions/cancel', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Implementation would go through paymentServiceHandler
      // For now, return structured response
      res.json({
        success: true,
        message: "Subscription cancellation initiated",
        status: "pending_cancellation"
      });
      
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // POST /api/billing/subscriptions/update - Update current subscription plan
  app.post('/api/billing/subscriptions/update', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { stripePriceId } = req.body;
      
      if (!stripePriceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      // Get current active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      const currentSubscription = subscriptions.data[0];
      
      // Update the subscription to new price
      const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: stripePriceId,
        }],
        payment_behavior: 'allow_incomplete',
        proration_behavior: 'always_invoice',
        expand: ['latest_invoice.payment_intent']
      });

      // Check if payment is required (e.g., missing payment method)
      const latestInvoice = updatedSubscription.latest_invoice as any;
      
      if (latestInvoice?.payment_intent?.status === 'requires_payment_method') {
        // Need payment method - return client secret for Stripe Elements
        return res.json({
          success: true,
          requiresPayment: true,
          clientSecret: latestInvoice.payment_intent.client_secret,
          subscriptionId: updatedSubscription.id
        });
      }

      // Payment successful or no additional payment required
      return res.json({
        success: true,
        requiresPayment: false,
        message: "Subscription updated successfully"
      });

    } catch (error: any) {
      console.error('Subscription update error:', error);
      return res.status(500).json({ 
        error: error.message || "Failed to update subscription" 
      });
    }
  });

  // GET /api/billing/subscriptions/history - Get subscription history
  app.get('/api/billing/subscriptions/history', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Implementation would fetch from paymentServiceHandler
      // Return clean billing history (no payment processor details)
      res.json({
        subscriptions: [],
        payments: []
      });
      
    } catch (error) {
      console.error("Error fetching subscription history:", error);
      res.status(500).json({ error: "Failed to fetch subscription history" });
    }
  });
}