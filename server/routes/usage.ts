import { Express, Request, Response } from "express";
import { getBillingCycleWordUsageAnalytics, getUserBillingCycle } from "../subscriptionController";
import { getUserWordLimit } from "../paymentServiceHandler";

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

      const billingData = await getBillingCycleWordUsageAnalytics(userId);
      
      const response = {
        currentUsage: billingData.analytics.currentUsage,
        wordLimit: billingData.analytics.wordLimit,
        usagePercentage: billingData.analytics.usagePercentage,
        hasExceededLimit: billingData.analytics.hasExceededLimit,
        billingCycle: {
          startDate: billingData.analytics.billingCycleProgress.cycleStart.toISOString().split('T')[0],
          endDate: billingData.analytics.billingCycleProgress.cycleEnd.toISOString().split('T')[0],
          daysRemaining: billingData.analytics.billingCycleProgress.daysRemaining
        }
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

      const billingData = await getBillingCycleWordUsageAnalytics(userId);
      
      const response = {
        currentMonthUsage: billingData.analytics.currentUsage,
        wordLimitPercentage: billingData.analytics.usagePercentage,
        billingCycle: {
          daysRemaining: billingData.analytics.billingCycleProgress.daysRemaining,
          cycleStartDate: billingData.analytics.billingCycleProgress.cycleStart.toISOString().split('T')[0],
          cycleEndDate: billingData.analytics.billingCycleProgress.cycleEnd.toISOString().split('T')[0]
        },
        wordLimit: billingData.analytics.wordLimit,
        hasExceededLimit: billingData.analytics.hasExceededLimit
      };

      console.log('Final billing cycle data:', response.billingCycle);

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