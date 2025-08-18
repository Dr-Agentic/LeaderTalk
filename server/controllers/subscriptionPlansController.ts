import { Request, Response } from "express";
import { subscriptionPlanService } from "../services/subscriptionPlanService";

/**
 * Get all available billing products formatted for specific platform
 */
async function getBillingProducts(req: Request, res: Response) {
  try {
    const platform = _extractPlatform(req);
    console.log(`📦 Loading subscription plans for platform: ${platform}`);
    
    const plans = subscriptionPlanService.getPlansForPlatform(platform);
    const billingProducts = _transformPlansToProducts(plans);
    const sortedProducts = _sortProductsByDisplayOrder(billingProducts);

    console.log(`✅ Returning ${sortedProducts.length} subscription plans for ${platform}`);
    res.json(sortedProducts);
  } catch (error) {
    console.error("❌ Failed to load subscription plans:", error);
    res.status(500).json({
      error: "Failed to load subscription plans",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get plan by code with platform-specific formatting
 */
async function getPlanByCode(req: Request, res: Response) {
  try {
    const { planCode } = req.params;
    const platform = _extractPlatform(req);
    
    const plan = subscriptionPlanService.getPlanByCode(planCode);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const formattedPlan = _formatPlanForPlatform(plan, platform);
    res.json(formattedPlan);
  } catch (error) {
    console.error("❌ Failed to get plan:", error);
    res.status(500).json({ error: "Failed to get plan" });
  }
}

/**
 * Validate subscription plans configuration
 */
async function validateConfiguration(req: Request, res: Response) {
  try {
    const validation = subscriptionPlanService.validateConfiguration();
    res.json(validation);
  } catch (error) {
    console.error("❌ Failed to validate configuration:", error);
    res.status(500).json({ error: "Failed to validate configuration" });
  }
}

// Private helper functions

/**
 * Extract platform from request headers
 */
function _extractPlatform(req: Request): 'web' | 'ios' | 'android' {
  return (req.headers['x-platform'] as 'web' | 'ios' | 'android') || 'web';
}

/**
 * Transform plans to billing products format
 */
function _transformPlansToProducts(plans: any[]): any[] {
  const products = [];
  
  for (const plan of plans) {
    if (plan.pricing.monthly) {
      products.push(_createProductVariant(plan, 'monthly'));
    }
    if (plan.pricing.yearly) {
      products.push(_createProductVariant(plan, 'yearly'));
    }
  }
  
  return products;
}

/**
 * Create product variant for specific billing interval
 */
function _createProductVariant(plan: any, interval: 'monthly' | 'yearly'): any {
  const pricing = plan.pricing[interval];
  const isYearly = interval === 'yearly';
  
  return {
    id: `${plan.code}_${interval}`,
    code: `${plan.code}_${interval}`,
    name: `${plan.name} ${isYearly ? 'Yearly' : 'Monthly'}`,
    description: _createDescription(plan, isYearly),
    productIcon: plan.metadata.icon || null,
    pricing: {
      amount: pricing.amount,
      formattedPrice: _formatPrice(pricing.amount, interval),
      formattedSavings: pricing.savings ? `Save ${pricing.savings.percentage}%` : null,
      interval,
      stripePriceId: pricing.platformId,
    },
    features: plan.features,
    isPopular: plan.metadata.isPopular && (!plan.pricing.yearly || isYearly),
    isDefault: plan.metadata.isDefault && (!plan.pricing.yearly || !isYearly),
    billingType: interval,
  };
}

/**
 * Create product description
 */
function _createDescription(plan: any, isYearly: boolean): string {
  const baseDesc = `${plan.features.wordLimit.toLocaleString()} words per month`;
  return isYearly ? `${baseDesc} (billed annually)` : baseDesc;
}

/**
 * Format price for display
 */
function _formatPrice(amount: number, interval: string): string {
  if (amount === 0) return 'Free';
  return `$${amount.toFixed(2)}/${interval === 'yearly' ? 'year' : 'month'}`;
}

/**
 * Sort products by display order from configuration
 */
function _sortProductsByDisplayOrder(products: any[]): any[] {
  return products.sort((a, b) => {
    const planA = subscriptionPlanService.getPlanByCode(a.code.replace(/_monthly|_yearly$/, ''));
    const planB = subscriptionPlanService.getPlanByCode(b.code.replace(/_monthly|_yearly$/, ''));
    return (planA?.metadata.displayOrder || 0) - (planB?.metadata.displayOrder || 0);
  });
}

/**
 * Format plan for specific platform
 */
function _formatPlanForPlatform(plan: any, platform: string): any {
  return {
    ...plan,
    platformIds: plan.platformIds[platform === 'web' ? 'stripe' : 'revenuecat'] || {}
  };
}

// Export controller object with 3-letter namespace alias
export const spc = {
  getBillingProducts,
  getPlanByCode,
  validateConfiguration,
};