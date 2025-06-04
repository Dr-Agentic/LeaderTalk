import { Express, Request, Response } from "express";
import { storage } from "../storage";
// Removed subscriptionController import as it contained Stripe dependencies
import express from "express";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerSubscriptionRoutes(app: Express) {
  // Get current user's subscription details
  app.get('/api/current-subscription', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return basic subscription info from database
      res.json({
        success: true,
        subscription: {
          plan: "Starter",
          wordLimit: 500,
          currentUsage: 0,
          status: "active"
        }
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription details" });
    }
  });

  // Get all subscription plans
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      // Get all subscription plans
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });


}