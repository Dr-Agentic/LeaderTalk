/**
 * Mobile Billing Routes
 * API endpoints for mobile app subscription management
 * Mirrors existing billing.ts structure for mobile payments
 */

import { Express, Request, Response } from "express";
import { 
  getMobileUserSubscription,
  getMobileBillingProducts,
  validateMobilePurchase
} from "../controllers/mobileSubscriptionController";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!(req.session as any)?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerMobileBillingRoutes(app: Express) {
  
  // GET /api/mobile/billing/subscription - Get current mobile subscription
  app.get('/api/mobile/billing/subscription', requireAuth, getMobileUserSubscription);

  // GET /api/mobile/billing/products - Get available mobile products and offerings
  app.get('/api/mobile/billing/products', requireAuth, getMobileBillingProducts);

  // POST /api/mobile/billing/validate-purchase - Validate mobile app purchase
  app.post('/api/mobile/billing/validate-purchase', requireAuth, validateMobilePurchase);

  // POST /api/mobile/billing/webhooks/revenuecat - RevenueCat webhook handler
  app.post('/api/mobile/billing/webhooks/revenuecat', async (req: Request, res: Response) => {
    try {
      const event = req.body;
      
      console.log('RevenueCat webhook received:', event.type || 'unknown');
      
      // Process webhook events
      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'PRODUCT_CHANGE':
        case 'CANCELLATION':
          // Handle subscription changes
          console.log('Processing subscription event:', event);
          break;
        
        default:
          console.log('Unhandled webhook event:', event.type);
      }
      
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('Error processing RevenueCat webhook:', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  });

  console.log('✅ Mobile billing routes registered');
}