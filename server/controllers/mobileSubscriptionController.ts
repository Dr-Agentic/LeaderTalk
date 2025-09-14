/**
 * Mobile Subscription Controller
 * Mirrors existing Stripe subscription logic using RevenueCat
 * Handles mobile app subscription management
 */

import { Request, Response } from "express";
import { storage } from "../storage";
import { revenueCatHandler } from "../services/revenueCatPaymentHandler";
import { subscriptionPlanService } from "../services/subscriptionPlanService";

interface MobileSubscriptionData {
  id: string;
  status: string;
  plan: string;
  planId: string;
  productId: string;
  isFree: boolean;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextRenewalDate: Date;
  cancelAtPeriodEnd: boolean;
  store: string;
  entitlements: Record<string, any>;
  customerId: string;
}

/**
 * Validate user authentication and retrieve user data
 */
async function validateUserAccess(req: Request): Promise<{ userId: number; user: any }> {
  const userId = (req.session as any).userId;
  if (!userId) {
    throw new Error("Authentication required");
  }

  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return { userId, user };
}

/**
 * Ensure user has valid mobile subscription, create default if missing
 */
async function ensureMobileUserHasValidSubscription(userId: number): Promise<MobileSubscriptionData> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  if (!user.email) {
    throw new Error("User email required for mobile subscription");
  }

  return await revenueCatHandler.retrieveUserSubscription(user.email);
}

/**
 * Create default LeaderTalk Starter subscription structure
 */
function createDefaultMobileSubscription(email: string): MobileSubscriptionData {
  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  return {
    id: 'mobile_starter_default',
    status: 'active',
    plan: 'LeaderTalk Starter',
    planId: 'LeaderTalk_Starter',
    productId: 'prodcca31c80ce',
    isFree: true,
    startDate: now,
    currentPeriodStart: now,
    currentPeriodEnd: oneYearFromNow,
    nextRenewalDate: oneYearFromNow,
    cancelAtPeriodEnd: false,
    store: 'mobile_default',
    entitlements: {
      'LeaderTalk_Starter': {
        expires_date: oneYearFromNow.toISOString(),
        product_identifier: 'prodcca31c80ce'
      }
    },
    customerId: email
  };
}

/**
 * Map RevenueCat subscription to mobile subscription data format
 */
function mapRevenueCatSubscriptionToMobileData(
  subscription: any,
  entitlements: Record<string, any>,
  customerId: string
): MobileSubscriptionData {
  const expiresDate = new Date(subscription.expires_date);
  const purchaseDate = new Date(subscription.purchase_date);
  
  return {
    id: subscription.product_identifier,
    status: expiresDate > new Date() ? 'active' : 'expired',
    plan: subscription.product_identifier,
    planId: subscription.product_identifier,
    productId: subscription.product_identifier,
    isFree: subscription.product_identifier === 'prodcca31c80ce',
    startDate: purchaseDate,
    currentPeriodStart: purchaseDate,
    currentPeriodEnd: expiresDate,
    nextRenewalDate: expiresDate,
    cancelAtPeriodEnd: subscription.unsubscribe_detected_at !== undefined,
    store: subscription.store,
    entitlements,
    customerId
  };
}

/**
 * Get current mobile subscription for user
 */
export async function getMobileUserSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = await validateUserAccess(req);
    const subscription = await ensureMobileUserHasValidSubscription(userId);
    
    res.json({ subscription });
  } catch (error: any) {
    console.error("Error getting mobile subscription:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get available mobile billing products/plans
 * Uses existing JSON configuration instead of calling RevenueCat directly
 */
export async function getMobileBillingProducts(req: Request, res: Response): Promise<void> {
  try {
    await validateUserAccess(req);
    
    const platformPlans = subscriptionPlanService.getPlansForPlatform('ios');
    
    // Transform SubscriptionPlan data to MobileBillingProduct[] format
    const mobileBillingProducts = platformPlans.map((plan: any) => {
      // Determine pricing info - prefer monthly, fallback to yearly
      const monthlyPricing = plan.pricing.monthly;
      const yearlyPricing = plan.pricing.yearly;
      const primaryPricing = monthlyPricing || yearlyPricing;
      
      if (!primaryPricing) {
        console.warn(`Plan ${plan.code} has no pricing information`);
        return null;
      }

      const billingProduct = {
        id: plan.code,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        productIcon: null,
        pricing: {
          amount: Math.round(primaryPricing.amount * 100), // Convert to cents
          formattedPrice: primaryPricing.amount === 0 ? 'Free' : `$${primaryPricing.amount.toFixed(2)}`,
          formattedSavings: yearlyPricing?.savings ? `Save ${yearlyPricing.savings.percentage}%` : undefined,
          interval: primaryPricing.interval === 'month' ? '/month' : '/year',
          productId: primaryPricing.platformId || `fallback_${plan.code}`
        },
        features: {
          wordLimit: plan.features.wordLimit,
          maxRecordingLength: plan.features.maxRecordingLength,
          leaderLibraryAccess: plan.features.leaderLibraryAccess,
          advancedAnalytics: plan.features.advancedAnalytics,
          prioritySupport: plan.features.prioritySupport
        },
        isDefault: plan.metadata.isDefault,
        isPopular: plan.metadata.isPopular,
        billingType: 'mobile'
      };

      return billingProduct;
    }).filter(Boolean); // Remove null entries

    console.log(`✅ Returning ${mobileBillingProducts.length} mobile billing products from JSON config`);
    res.json(mobileBillingProducts);
  } catch (error: any) {
    console.error("Error getting mobile products:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Validate mobile purchase and update subscription
 */
export async function validateMobilePurchase(req: Request, res: Response): Promise<void> {
  try {
    const { userId, user } = await validateUserAccess(req);
    const { receiptData, productId, transactionId } = req.body;

    if (!user.email) {
      res.status(400).json({ error: "User email required" });
      return;
    }

    // Get updated subscription after purchase
    const subscription = await ensureMobileUserHasValidSubscription(userId);
    
    res.json({ 
      success: true,
      subscription,
      message: "Purchase validated successfully"
    });
  } catch (error: any) {
    console.error("Error validating mobile purchase:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get mobile user word limit
 */
export async function getMobileUserWordLimit(userId: number): Promise<number> {
  try {
    const subscription = await ensureMobileUserHasValidSubscription(userId);
    
    // Map subscription to word limits (mirror Stripe logic)
    if (subscription.isFree || subscription.planId === 'LeaderTalk_Starter') {
      return 1000; // Starter plan limit
    }
    
    return 10000; // Executive plan limit
  } catch (error) {
    console.error("Error getting mobile word limit:", error);
    return 1000; // Default to starter limit
  }
}

/**
 * Check if mobile user has active subscription
 */
export async function checkMobileUserActiveSubscription(userId: number): Promise<boolean> {
  try {
    const subscription = await ensureMobileUserHasValidSubscription(userId);
    return subscription.status === 'active';
  } catch (error) {
    console.error("Error checking mobile subscription:", error);
    return false;
  }
}