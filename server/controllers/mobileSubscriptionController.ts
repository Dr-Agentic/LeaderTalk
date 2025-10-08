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
  console.log('🔄 [validateUserAccess] BEGIN - Input:', {
    sessionId: (req.session as any)?.id,
    sessionUserId: (req.session as any)?.userId,
    sessionData: req.session
  });

  const userId = (req.session as any).userId;
  if (!userId) {
    console.error('❌ [validateUserAccess] No userId in session');
    throw new Error("Authentication required");
  }

  console.log('🔄 [validateUserAccess] Getting user from storage:', { userId });
  const user = await storage.getUser(userId);
  if (!user) {
    console.error('❌ [validateUserAccess] User not found in storage:', { userId });
    throw new Error("User not found");
  }

  const result = { userId, user };
  console.log('✅ [validateUserAccess] SUCCESS - Result:', result);
  return result;
}

/**
 * Ensure user has valid mobile subscription, create default if missing
 */
async function ensureMobileUserHasValidSubscription(userId: number): Promise<MobileSubscriptionData> {
  console.log('🔄 [ensureMobileUserHasValidSubscription] BEGIN - Input:', { userId });

  const user = await storage.getUser(userId);
  if (!user) {
    console.error('❌ [ensureMobileUserHasValidSubscription] User not found:', { userId });
    throw new Error(`User not found: ${userId}`);
  }

  console.log('🔄 [ensureMobileUserHasValidSubscription] User retrieved:', { 
    userId, 
    userEmail: user.email,
    userName: user.name 
  });

  if (!user.email) {
    console.error('❌ [ensureMobileUserHasValidSubscription] User email missing:', { userId, user });
    throw new Error("User email required for mobile subscription");
  }

  console.log('🔄 [ensureMobileUserHasValidSubscription] Calling RevenueCat handler:', { email: user.email });
  const subscription = await revenueCatHandler.retrieveUserSubscription(user.email);
  
  console.log('✅ [ensureMobileUserHasValidSubscription] SUCCESS - Result:', { subscription });
  return subscription;
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
  console.log('🔄 [getMobileUserSubscription] BEGIN - Input:', {
    sessionId: (req.session as any)?.id,
    userId: (req.session as any)?.userId,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  try {
    const { userId } = await validateUserAccess(req);
    console.log('🔄 [getMobileUserSubscription] User validated:', { userId });
    
    const subscription = await ensureMobileUserHasValidSubscription(userId);
    console.log('🔄 [getMobileUserSubscription] Subscription retrieved:', { subscription });
    
    const result = { 
      hasSubscription: true,
      subscription 
    };
    
    console.log('✅ [getMobileUserSubscription] SUCCESS - Result:', result);
    res.json(result);
  } catch (error: any) {
    console.error("❌ [getMobileUserSubscription] ERROR:", {
      error: error.message,
      stack: error.stack,
      userId: (req.session as any)?.userId
    });
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get available mobile billing products/plans
 * Uses existing JSON configuration instead of calling RevenueCat directly
 */
export async function getMobileBillingProducts(req: Request, res: Response): Promise<void> {
  console.log('🔄 [getMobileBillingProducts] BEGIN - Input:', {
    sessionId: (req.session as any)?.id,
    userId: (req.session as any)?.userId,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  try {
    await validateUserAccess(req);
    console.log('🔄 [getMobileBillingProducts] User validated');
    
    const platformPlans = subscriptionPlanService.getPlansForPlatform('ios');
    console.log('🔄 [getMobileBillingProducts] Platform plans retrieved:', { 
      platformPlans,
      count: platformPlans.length 
    });
    
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

    console.log(`✅ [getMobileBillingProducts] SUCCESS - Result:`, {
      mobileBillingProducts,
      count: mobileBillingProducts.length
    });
    res.json(mobileBillingProducts);
  } catch (error: any) {
    console.error("❌ [getMobileBillingProducts] ERROR:", {
      error: error.message,
      stack: error.stack,
      userId: (req.session as any)?.userId
    });
    res.status(500).json({ error: error.message });
  }
}

/**
 * Validate mobile purchase and update subscription
 */
export async function validateMobilePurchase(req: Request, res: Response): Promise<void> {
  console.log('🔄 [validateMobilePurchase] BEGIN - Input:', {
    sessionId: (req.session as any)?.id,
    userId: (req.session as any)?.userId,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  try {
    const { userId, user } = await validateUserAccess(req);
    console.log('🔄 [validateMobilePurchase] User validated:', { userId, userEmail: user.email });
    
    const { receiptData, productId, transactionId } = req.body;
    console.log('🔄 [validateMobilePurchase] Purchase data:', { receiptData, productId, transactionId });

    if (!user.email) {
      console.error('❌ [validateMobilePurchase] Missing user email');
      res.status(400).json({ error: "User email required" });
      return;
    }

    // Get updated subscription after purchase
    const subscription = await ensureMobileUserHasValidSubscription(userId);
    console.log('🔄 [validateMobilePurchase] Subscription ensured:', { subscription });
    
    const result = { 
      success: true,
      subscription,
      message: "Purchase validated successfully"
    };
    
    console.log('✅ [validateMobilePurchase] SUCCESS - Result:', result);
    res.json(result);
  } catch (error: any) {
    console.error("❌ [validateMobilePurchase] ERROR:", {
      error: error.message,
      stack: error.stack,
      userId: (req.session as any)?.userId,
      body: req.body
    });
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