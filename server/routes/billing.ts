import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { 
  getUserSubscription,
  createDefaultSubscription,
  ensureUserHasStripeCustomer
} from "../paymentServiceHandler";
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
  
  // GET /api/billing/products - Get all available subscription plans
  app.get('/api/billing/products', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      
      // Transform to clean billing format (no Stripe references)
      const billingProducts = plans.map(plan => ({
        id: plan.id.toString(),
        code: plan.planCode,
        name: plan.name,
        description: `${plan.monthlyWordLimit.toLocaleString()} words per month`,
        pricing: {
          monthly: {
            amount: parseFloat(plan.monthlyPriceUsd),
            currency: 'usd'
          },
          yearly: {
            amount: parseFloat(plan.yearlyPriceUsd),
            currency: 'usd'
          }
        },
        features: {
          wordLimit: plan.monthlyWordLimit,
          benefits: plan.features || []
        },
        isDefault: plan.isDefault || false
      }));
      
      res.json(billingProducts);
    } catch (error) {
      console.error("Error fetching billing products:", error);
      res.status(500).json({ error: "Failed to fetch billing products" });
    }
  });

  // GET /api/billing/subscriptions/current - Get user's current subscription
  app.get('/api/billing/subscriptions/current', requireAuth, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      return getCurrentSubscription(req, res);
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription details" });
    }
  });

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