import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { 
  getCurrentSubscription
} from "../subscriptionController";
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
    // Set explicit content type to ensure proper JSON response
    res.setHeader('Content-Type', 'application/json');
    
    // Call the subscription handler function
    return getCurrentSubscription(req, res);
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

  // TODO: Add subscription management endpoints as needed
  // These endpoints were temporarily removed during refactoring
}