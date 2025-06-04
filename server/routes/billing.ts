import { Express, Request, Response } from "express";
import { storage } from "../storage";
// Removed payment service imports - now using database-only subscription management

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
      
      const formattedPlans = plans.map(plan => ({
        id: plan.planCode,
        name: plan.name,
        pricing: {
          monthly: {
            amount: parseFloat(plan.monthlyPriceUsd) * 100,
            formattedAmount: `$${plan.monthlyPriceUsd}`
          }
        },
        wordLimit: plan.monthlyWordLimit,
        features: plan.features || [],
        isPopular: plan.name === "Pro"
      }));
      
      res.json(formattedPlans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // GET /api/billing/subscriptions/current - Get user's current subscription
  app.get('/api/billing/subscriptions/current', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's current plan from database
      const defaultPlan = await storage.getDefaultSubscriptionPlan();
      
      res.json({
        success: true,
        hasSubscription: true,
        subscription: {
          id: "default",
          status: "active",
          plan: defaultPlan.name,
          planId: defaultPlan.planCode,
          isFree: parseFloat(defaultPlan.monthlyPriceUsd) === 0,
          formattedAmount: `$${defaultPlan.monthlyPriceUsd}`,
          formattedInterval: "month",
          startDate: user.createdAt,
          formattedStartDate: user.createdAt.toLocaleDateString(),
          currentPeriodStart: user.createdAt,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          formattedCurrentPeriod: "Current billing period",
          nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          formattedNextRenewal: "Next month",
          wordLimit: defaultPlan.monthlyWordLimit,
          currentUsage: 0,
          formattedUsage: "0 words used",
          usagePercentage: 0,
          cancelAtPeriodEnd: false,
          formattedStatus: "Active",
          statusColor: "green",
          daysRemaining: 30,
          formattedDaysRemaining: "30 days remaining"
        }
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription details" });
    }
  });

  // POST /api/billing/subscriptions/update - Contact support for plan changes
  app.post('/api/billing/subscriptions/update', requireAuth, async (req, res) => {
    res.json({
      success: false,
      error: "Please contact support to change your subscription plan",
      supportMessage: "Subscription changes are handled through customer support"
    });
  });


}