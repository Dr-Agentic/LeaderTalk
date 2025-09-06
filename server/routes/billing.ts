import express, { Express, Request, Response } from "express";
import { storage } from "../storage";
import { 
  retrievePaymentSubscriptionById,
  createDefaultSubscription,
  ensureUserHasStripeCustomer,
  getCustomerPaymentMethods,
  setDefaultPaymentMethod,
  createPaymentMethodSetupIntent,
  getSubscriptionChangePreview,
  executeUpgradeWithProration,
  scheduleSubscriptionDowngrade,
  getScheduledSubscriptions,
  cancelScheduledChange
} from "../paymentServiceHandler";
import { 
  getCurrentSubscriptionFormatted,
  updateUserSubscription,
  cancelSubscription
} from "../subscriptionController";
import { spc } from "../controllers/subscriptionPlansController";
import { handleRevenueCatWebhook } from "../subscription";
import Stripe from "stripe";
import { config } from "../config/environment";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerBillingRoutes(app: Express) {
  
  // RevenueCat webhook endpoint for handling mobile subscription events
  app.post('/api/billing/webhooks/revenuecat', express.raw({type: 'application/json'}), handleRevenueCatWebhook);

  // Stripe webhook endpoint for handling payment events
  app.post('/api/billing/webhooks/stripe', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.log('⚠️ Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;
    try {
      const stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2023-10-16',
      });
      
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
      console.log('✅ Stripe webhook event received:', event.type);
    } catch (err: any) {
      console.log('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'setup_intent.succeeded':
        console.log('🎯 Setup intent succeeded:', event.data.object.id);
        // Payment method has been successfully attached
        break;
        
      case 'payment_method.attached':
        console.log('💳 Payment method attached:', event.data.object.id);
        // Payment method is now available for subscriptions
        break;
        
      case 'customer.subscription.updated':
        console.log('🔄 Subscription updated:', event.data.object.id);
        break;
        
      case 'invoice.payment_succeeded':
        console.log('✅ Payment succeeded for invoice:', event.data.object.id);
        break;
        
      case 'invoice.payment_failed':
        console.log('❌ Payment failed for invoice:', event.data.object.id);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  });
  
  // GET /api/billing/products - Get all available subscription plans with server-side formatting
  app.get('/api/billing/products', spc.getBillingProducts);

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
  app.post('/api/billing/subscriptions/cancel', requireAuth, cancelSubscription);

  // POST /api/billing/subscriptions/update - Update current subscription plan
  app.post('/api/billing/subscriptions/update', requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { stripePriceId } = req.body;
      
      if (!stripePriceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      // Use the subscription controller to maintain proper architecture
      const result = await updateUserSubscription(userId, stripePriceId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json(result);

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

  // GET /api/billing/payment-methods - Get user's payment methods
  app.get('/api/billing/payment-methods', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return res.json({ paymentMethods: [] });
      }

      const paymentMethods = await getCustomerPaymentMethods(user.stripeCustomerId);
      res.json({ paymentMethods });
      
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  // POST /api/billing/payment-methods/setup - Create setup intent for new payment method
  app.post('/api/billing/payment-methods/setup', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stripeCustomerId = await ensureUserHasStripeCustomer(user);
      const { clientSecret } = await createPaymentMethodSetupIntent(stripeCustomerId);
      
      res.json({ clientSecret });
      
    } catch (error: any) {
      console.error("Error creating payment method setup:", error);
      res.status(500).json({ error: "Failed to create payment method setup" });
    }
  });

  // POST /api/billing/payment-methods/set-default - Set default payment method
  app.post('/api/billing/payment-methods/set-default', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ error: "Payment method ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "User payment profile not found" });
      }

      await setDefaultPaymentMethod(user.stripeCustomerId, paymentMethodId);
      res.json({ success: true });
      
    } catch (error: any) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ error: "Failed to set default payment method" });
    }
  });

  // POST /api/billing/subscription/preview - Get subscription change preview
  app.post('/api/billing/subscription/preview', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { stripePriceId } = req.body;
      
      if (!stripePriceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "User not found" });
      }

      const preview = await getSubscriptionChangePreview(
        user.stripeCustomerId,
        stripePriceId
      );
      
      res.json(preview);
      
    } catch (error: any) {
      console.error("Error getting subscription change preview:", error);
      res.status(500).json({ error: "Failed to get subscription change preview" });
    }
  });

  // POST /api/billing/subscription/change - Execute subscription change
  app.post('/api/billing/subscription/change', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { stripePriceId, changeType } = req.body;
      
      if (!stripePriceId || !changeType) {
        return res.status(400).json({ error: "Price ID and change type are required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "User not found" });
      }

      let result;
      if (changeType === 'upgrade' || changeType === 'same') {
        result = await executeUpgradeWithProration(user.stripeCustomerId, stripePriceId);
      } else if (changeType === 'downgrade') {
        result = await scheduleSubscriptionDowngrade(user.stripeCustomerId, stripePriceId);
      } else {
        return res.status(400).json({ error: "Invalid change type" });
      }
      
      res.json(result);
      
    } catch (error: any) {
      console.error("Error executing subscription change:", error);
      res.status(500).json({ error: "Failed to execute subscription change" });
    }
  });

  // GET /api/billing/subscription/scheduled - Get scheduled subscription changes
  app.get('/api/billing/subscription/scheduled', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      
      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "User not found" });
      }

      const scheduled = await getScheduledSubscriptions(user.stripeCustomerId);
      res.json(scheduled);
      
    } catch (error: any) {
      console.error("Error getting scheduled subscriptions:", error);
      res.status(500).json({ error: "Failed to get scheduled subscriptions" });
    }
  });

  // POST /api/billing/subscription/scheduled/cancel - Cancel scheduled change
  app.post('/api/billing/subscription/scheduled/cancel', requireAuth, async (req, res) => {
    try {
      const { scheduleId } = req.body;
      
      if (!scheduleId) {
        return res.status(400).json({ 
          success: false,
          error: "Schedule ID is required" 
        });
      }

      const result = await cancelScheduledChange(scheduleId);
      res.json(result);
      
    } catch (error: any) {
      console.error("Error cancelling scheduled change:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to cancel scheduled change" 
      });
    }
  });

  // DELETE /api/billing/subscription/scheduled/:id - Cancel scheduled change (alternative endpoint)
  app.delete('/api/billing/subscription/scheduled/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Subscription ID is required" });
      }

      const result = await cancelScheduledChange(id);
      res.json(result);
      
    } catch (error: any) {
      console.error("Error cancelling scheduled change:", error);
      res.status(500).json({ error: "Failed to cancel scheduled change" });
    }
  });


}