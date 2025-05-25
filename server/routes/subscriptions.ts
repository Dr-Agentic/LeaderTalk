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

  // Get Stripe products (subscription plans)
  app.get('/api/stripe-products', async (req, res) => {
    try {
      // Get all subscription plans from database
      const plans = await storage.getSubscriptionPlans();
      
      // Transform to match expected frontend format
      const formattedPlans = plans.map(plan => ({
        id: plan.id.toString(),
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        wordLimit: plan.wordLimit,
        features: plan.features || [],
        priceId: plan.stripeProductId || plan.id.toString()
      }));
      
      res.json(formattedPlans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Create Stripe subscription
  app.post('/api/create-stripe-subscription', requireAuth, async (req, res) => {
    try {
      const { priceId } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }
      
      // For now, return a mock response since we're focusing on frontend security
      // This should be replaced with actual Stripe integration when ready
      res.json({ 
        message: "Subscription endpoint ready for Stripe integration",
        priceId,
        status: "pending_setup"
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });
}