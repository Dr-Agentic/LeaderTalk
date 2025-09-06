import fs from 'fs';
import path from 'path';

// TypeScript interfaces for type safety
export interface SubscriptionPlanFeatures {
  wordLimit: number;
  maxRecordingLength: number;
  leaderLibraryAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customReports: boolean;
}

export interface PricingInfo {
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  savings?: {
    amount: number;
    percentage: number;
  };
}

export interface PlatformIds {
  stripe?: {
    monthly?: string | null;
    yearly?: string | null;
  };
  revenuecat?: {
    monthly?: string | null;
    yearly?: string | null;
  };
  googlePlay?: {
    monthly?: string | null;
    yearly?: string | null;
  };
}

export interface PlanMetadata {
  isDefault: boolean;
  isPopular: boolean;
  displayOrder: number;
  color: string;
  icon: string;
  badge?: string;
}

export interface SubscriptionPlan {
  planCode: string;
  name: string;
  description: string;
  tier: 'free' | 'premium' | 'enterprise';
  features: SubscriptionPlanFeatures;
  pricing: {
    monthly?: PricingInfo;
    yearly?: PricingInfo;
  };
  platformIds: PlatformIds;
  metadata: PlanMetadata;
}

export interface SubscriptionPlansConfig {
  plans: Record<string, SubscriptionPlan>;
  metadata: {
    version: string;
    lastUpdated: string;
    environment: string;
    supportedPlatforms: string[];
    supportedCurrencies: string[];
    defaultPlan: string;
  };
}

export type Platform = 'web' | 'ios' | 'android';
export type BillingInterval = 'monthly' | 'yearly';

class SubscriptionPlanService {
  private static instance: SubscriptionPlanService;
  private plansConfig: SubscriptionPlansConfig | null = null;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'server', 'config', 'subscriptionPlans.json');
  }

  static getInstance(): SubscriptionPlanService {
    if (!SubscriptionPlanService.instance) {
      SubscriptionPlanService.instance = new SubscriptionPlanService();
    }
    return SubscriptionPlanService.instance;
  }

  /**
   * Load subscription plans from JSON file
   */
  private loadPlans(): SubscriptionPlansConfig {
    if (this.plansConfig) {
      return this.plansConfig;
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.plansConfig = JSON.parse(configData) as SubscriptionPlansConfig;
      
      console.log(`✅ Loaded ${Object.keys(this.plansConfig.plans).length} subscription plans from JSON config`);
      return this.plansConfig;
    } catch (error) {
      console.error('❌ Failed to load subscription plans config:', error);
      throw new Error('Unable to load subscription plans configuration');
    }
  }

  /**
   * Get all subscription plans
   */
  getAllPlans(): SubscriptionPlan[] {
    const config = this.loadPlans();
    return Object.values(config.plans).sort((a, b) => a.metadata.displayOrder - b.metadata.displayOrder);
  }

  /**
   * Get plan by plan code
   */
  getPlanByCode(planCode: string): SubscriptionPlan | null {
    const config = this.loadPlans();
    return config.plans[planCode] || null;
  }

  /**
   * Get default plan
   */
  getDefaultPlan(): SubscriptionPlan {
    const config = this.loadPlans();
    const defaultPlanCode = config.metadata.defaultPlan;
    const defaultPlan = config.plans[defaultPlanCode];
    
    if (!defaultPlan) {
      throw new Error(`Default plan '${defaultPlanCode}' not found in configuration`);
    }
    
    return defaultPlan;
  }

  /**
   * Get plans formatted for specific platform
   */
  getPlansForPlatform(platform: Platform): any[] {
    const plans = this.getAllPlans();
    
    return plans.map(plan => {
      const formattedPlan = {
        id: plan.planCode,
        code: plan.planCode,
        name: plan.name,
        description: plan.description,
        tier: plan.tier,
        features: plan.features,
        metadata: plan.metadata,
        pricing: {} as any,
        platformIds: {} as any
      };

      // Add monthly pricing if available
      if (plan.pricing.monthly) {
        formattedPlan.pricing.monthly = {
          ...plan.pricing.monthly,
          platformId: this.getPlatformId(plan, platform, 'monthly')
        };
      }

      // Add yearly pricing if available
      if (plan.pricing.yearly) {
        formattedPlan.pricing.yearly = {
          ...plan.pricing.yearly,
          platformId: this.getPlatformId(plan, platform, 'yearly')
        };
      }

      return formattedPlan;
    });
  }

  /**
   * Get platform-specific product ID
   */
  getPlatformId(plan: SubscriptionPlan, platform: Platform, interval: BillingInterval): string | null {
    const platformKey = platform === 'web' ? 'stripe' : 
                       platform === 'ios' ? 'revenuecat' : 
                       'googlePlay';
    
    const intervalKey = interval === 'monthly' ? 'monthly' : 'yearly';
    
    return plan.platformIds[platformKey]?.[intervalKey] || null;
  }

  /**
   * Get plan by platform-specific product ID
   */
  getPlanByPlatformId(platform: Platform, productId: string): SubscriptionPlan | null {
    const plans = this.getAllPlans();
    
    for (const plan of plans) {
      const platformKey = platform === 'web' ? 'stripe' : 
                         platform === 'ios' ? 'revenuecat' : 
                         'googlePlay';
      
      const platformIds = plan.platformIds[platformKey];
      if (platformIds) {
        if (platformIds.monthly === productId || platformIds.yearly === productId) {
          return plan;
        }
      }
    }
    
    return null;
  }

  /**
   * Validate plan configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const config = this.loadPlans();
      
      // Check if default plan exists
      if (!config.plans[config.metadata.defaultPlan]) {
        errors.push(`Default plan '${config.metadata.defaultPlan}' not found`);
      }
      
      // Validate each plan
      Object.entries(config.plans).forEach(([planCode, plan]) => {
        if (plan.planCode !== planCode) {
          errors.push(`Plan code mismatch: key '${planCode}' vs plan.planCode '${plan.planCode}'`);
        }
        
        if (!plan.pricing.monthly && !plan.pricing.yearly) {
          errors.push(`Plan '${planCode}' has no pricing information`);
        }
        
        if (plan.features.wordLimit <= 0) {
          errors.push(`Plan '${planCode}' has invalid word limit`);
        }
      });
      
    } catch (error) {
      errors.push(`Configuration loading error: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reload configuration (useful for development)
   */
  reloadConfiguration(): void {
    this.plansConfig = null;
    this.loadPlans();
  }
}

export const subscriptionPlanService = SubscriptionPlanService.getInstance();