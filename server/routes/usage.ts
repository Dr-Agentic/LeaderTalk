import { Express, Request, Response } from "express";
import { getUserSubscriptionData, calculateBillingCycleInfo, calculateUsagePercentage } from "../billingService";
import { getUserBillingCycle, getUserWordLimit } from "../paymentServiceHandler";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerUsageRoutes(app: Express) {
  // Get billing cycle information
  app.get('/api/usage/billing-cycle', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const billingData = await getUserSubscriptionData(userId);
      
      const response = {
        currentUsage: billingData.currentUsage,
        wordLimit: billingData.stripeWordLimit,
        usagePercentage: calculateUsagePercentage(billingData.currentUsage, billingData.stripeWordLimit),
        hasExceededLimit: billingData.currentUsage > billingData.stripeWordLimit,
        billingCycle: billingData.billingCycle ? {
          startDate: billingData.billingCycle.start.toISOString().split('T')[0],
          endDate: billingData.billingCycle.end.toISOString().split('T')[0],
          daysRemaining: calculateBillingCycleInfo(billingData.billingCycle).daysRemaining
        } : null
      };

      console.log('✅ Returning billing cycle data:', response);
      res.json(response);
    } catch (error) {
      console.error("Error fetching billing cycle data:", error);
      res.status(500).json({ error: "Failed to fetch billing cycle data" });
    }
  });

  // Get word usage information
  app.get('/api/usage/words', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const billingData = await getUserSubscriptionData(userId);
      const billingCycle = billingData.billingCycle;
      
      const response = {
        currentMonthUsage: billingData.currentUsage,
        wordLimitPercentage: calculateUsagePercentage(billingData.currentUsage, billingData.stripeWordLimit),
        billingCycle: billingCycle ? calculateBillingCycleInfo(billingCycle) : null,
        wordLimit: billingData.stripeWordLimit,
        hasExceededLimit: billingData.currentUsage > billingData.stripeWordLimit
      };

      console.log('Final billing cycle data:', billingCycle ? {
        startDate: billingCycle.start.toISOString().split('T')[0],
        endDate: billingCycle.end.toISOString().split('T')[0],
        daysRemaining: calculateBillingCycleInfo(billingCycle).daysRemaining
      } : null);

      res.json(response);
    } catch (error) {
      console.error("Error fetching word usage:", error);
      res.status(500).json({ error: "Failed to fetch word usage data" });
    }
  });

  // Get usage history
  app.get('/api/usage/history', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // This would typically fetch historical usage data
      // For now, return basic structure
      const response = {
        monthlyHistory: [],
        totalUsage: 0,
        averageUsage: 0
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching usage history:", error);
      res.status(500).json({ error: "Failed to fetch usage history" });
    }
  });
}