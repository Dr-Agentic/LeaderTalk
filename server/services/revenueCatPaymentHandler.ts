/**
 * RevenueCat Payment Handler
 * Handles all RevenueCat API interactions for mobile payments
 * Uses email-based customer lookup to avoid database ID synchronization
 */

interface RevenueCatConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

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

interface RevenueCatCustomer {
  app_user_id: string;
  email?: string;
  first_seen: string;
  last_seen: string;
  management_url: string;
  original_app_user_id: string;
  original_application_version?: string;
  original_purchase_date?: string;
  other_purchases: Record<string, any>;
  subscriptions: Record<string, RevenueCatSubscription>;
  non_subscriptions: Record<string, any>;
  entitlements: Record<string, RevenueCatEntitlement>;
}

interface RevenueCatSubscription {
  auto_resume_date?: string;
  billing_issues_detected_at?: string;
  expires_date: string;
  grace_period_expires_date?: string;
  is_sandbox: boolean;
  original_purchase_date: string;
  ownership_type: string;
  period_type: string;
  product_identifier: string;
  purchase_date: string;
  refunded_at?: string;
  store: string;
  unsubscribe_detected_at?: string;
}

interface RevenueCatEntitlement {
  expires_date?: string;
  grace_period_expires_date?: string;
  product_identifier: string;
  purchase_date: string;
}

interface RevenueCatOffering {
  id: string;
  display_name: string;
  created_at: number;
  is_current: boolean;
  lookup_key: string;
  metadata?: Record<string, any>;
  object: string;
  project_id: string;
  packages?: RevenueCatPackage[];
}

interface RevenueCatPackage {
  identifier: string;
  platform_product_identifier: string;
}

interface RevenueCatProduct {
  id: string;
  display_name: string;
  app_id: string;
  created_at: number;
  object: string;
  store_identifier: string;
  type: string;
  one_time?: any;
  subscription?: {
    duration?: string;
    grace_period_duration?: string;
    trial_duration?: string;
  };
}

class RevenueCatPaymentHandler {
  private config: RevenueCatConfig;

  constructor() {
    this.config = {
      secretKey: process.env.REVENUECAT_SECRET_KEY || '',
      publicKey: process.env.REVENUECAT_PUBLIC_KEY || '',
      baseUrl: 'https://api.revenuecat.com/v2'
    };

    if (!this.config.secretKey) {
      console.warn('⚠️ RevenueCat secret key not configured');
    }
  }

  /**
   * Make authenticated request to RevenueCat API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RevenueCat API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get current offerings from RevenueCat
   * Uses the projects/{project_id}/offerings endpoint
   */
  async getOfferings(): Promise<RevenueCatOffering[]> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/offerings`);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching RevenueCat offerings:', error);
      throw error;
    }
  }

  /**
   * Get all packages from all offerings
   */
  async getAllPackages(): Promise<RevenueCatPackage[]> {
    try {
      const offerings = await this.getOfferings();
      const packages: RevenueCatPackage[] = [];
      
      offerings.forEach(offering => {
        if (offering.packages) {
          packages.push(...offering.packages);
        }
      });
      
      return packages;
    } catch (error) {
      console.error('Error fetching RevenueCat packages:', error);
      throw error;
    }
  }

  /**
   * Get specific package by identifier
   */
  async getPackage(offeringId: string, packageId: string): Promise<RevenueCatPackage | null> {
    try {
      const offerings = await this.getOfferings();
      const offering = offerings.find(o => o.id === offeringId || o.lookup_key === offeringId);
      if (!offering) return null;
      
      return offering.packages?.find(p => p.identifier === packageId) || null;
    } catch (error) {
      console.error('Error fetching RevenueCat package:', error);
      throw error;
    }
  }

  /**
   * Get entitlements from project configuration
   */
  async getProjectEntitlements(): Promise<Record<string, any>[]> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/entitlements`);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching project entitlements:', error);
      throw error;
    }
  }

  /**
   * Get products from RevenueCat project
   */
  async getProducts(): Promise<RevenueCatProduct[]> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/products`);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching RevenueCat products:', error);
      throw error;
    }
  }

  /**
   * Get product information by identifier
   */
  async getProduct(productId: string): Promise<RevenueCatProduct | null> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/products/${productId}`);
      return data || null;
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        return null;
      }
      console.error('Error fetching RevenueCat product:', error);
      throw error;
    }
  }

  /**
   * Get customer by app user ID using V2 API
   */
  async getCustomer(appUserId: string): Promise<RevenueCatCustomer | null> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/customers/${encodeURIComponent(appUserId)}`);
      return data;
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        return null; // Customer doesn't exist
      }
      console.error('Error fetching RevenueCat customer:', error);
      throw error;
    }
  }

  /**
   * Get customer by email (legacy - requires email as app_user_id)
   */
  async getCustomerByEmail(email: string): Promise<RevenueCatCustomer | null> {
    return this.getCustomer(email);
  }

  /**
   * Create customer by app user ID using V2 API
   */
  async createCustomer(appUserId: string): Promise<RevenueCatCustomer> {
    const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
    const data = await this.makeRequest(`/projects/${projectId}/customers`, {
      method: 'POST',
      body: JSON.stringify({
        id: appUserId
      })
    });
    return data;
  }



  /**
   * Get customer's active subscriptions using V2 API
   */
  async getCustomerSubscriptions(appUserId: string): Promise<Record<string, RevenueCatSubscription>> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/customers/${encodeURIComponent(appUserId)}/subscriptions`);
      return data.items?.reduce((acc: any, sub: any) => {
        acc[sub.id] = sub;
        return acc;
      }, {}) || {};
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get customer's entitlements using V2 API
   */
  async getCustomerEntitlements(appUserId: string): Promise<Record<string, RevenueCatEntitlement>> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      const data = await this.makeRequest(`/projects/${projectId}/customers/${encodeURIComponent(appUserId)}/active_entitlements`);
      return data.items?.reduce((acc: any, ent: any) => {
        acc[ent.entitlement_id] = ent;
        return acc;
      }, {}) || {};
    } catch (error) {
      console.error('Error fetching customer entitlements:', error);
      throw error;
    }
  }

  /**
   * Check if customer has active subscription
   */
  async hasActiveSubscription(appUserId: string): Promise<boolean> {
    try {
      const subscriptions = await this.getCustomerSubscriptions(appUserId);
      const now = new Date();
      
      return Object.values(subscriptions).some(sub => {
        const expiresDate = new Date(sub.expires_date);
        return expiresDate > now;
      });
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Grant promotional entitlement using V2 API
   */
  async grantPromoEntitlement(appUserId: string, entitlementId: string, duration?: string): Promise<void> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      await this.makeRequest(`/projects/${projectId}/customers/${encodeURIComponent(appUserId)}/entitlements/${entitlementId}/promotional_grant`, {
        method: 'POST',
        body: JSON.stringify({
          duration: duration || 'P1M'
        })
      });
    } catch (error) {
      console.error('Error granting promotional entitlement:', error);
      throw error;
    }
  }

  /**
   * Retrieve user subscription with default creation logic
   */
  async retrieveUserSubscription(email: string): Promise<MobileSubscriptionData> {
    // Try to get existing customer
    let customer = await this.getCustomer(email);
    
    if (!customer) {
      // Create customer if doesn't exist
      customer = await this.createCustomer(email);
    }
    
    // Get subscriptions and check for active ones
    const subscriptions = await this.getCustomerSubscriptions(email);
    const activeSubscriptions = Object.values(subscriptions).filter(sub => {
      const expiresDate = new Date(sub.expires_date);
      return expiresDate > new Date();
    });
    
    if (activeSubscriptions.length === 0) {
      // No active subscription - create default
      const defaultOffering = await this._findDefaultOffering();
      if (defaultOffering) {
        return await this._createDefaultSubscription(email, defaultOffering);
      }
    }
    
    // Return existing subscription
    const entitlements = await this.getCustomerEntitlements(email);
    return this._mapToMobileSubscriptionData(activeSubscriptions[0], entitlements, email);
  }

  /**
   * Test connection to RevenueCat API
   */
  async testConnection(): Promise<boolean> {
    try {
      const projectId = process.env.REVENUECAT_PROJECT_ID || 'proj209f9e71';
      await this.makeRequest(`/projects/${projectId}/offerings`);
      return true;
    } catch (error: any) {
      console.error('RevenueCat connection test failed:', error);
      return false;
    }
  }
  /**
   * Find offering with default_subscription metadata
   */
  private async _findDefaultOffering(): Promise<RevenueCatOffering | null> {
    const offerings = await this.getOfferings();
    return offerings.find(offering => 
      offering.metadata?.default_subscription === 'true' || 
      offering.metadata?.default_subscription === true
    ) || null;
  }

  /**
   * Create default subscription structure
   */
  private async _createDefaultSubscription(email: string, offering: RevenueCatOffering): Promise<MobileSubscriptionData> {
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      id: `default_${offering.id}`,
      status: 'active',
      plan: offering.display_name,
      planId: offering.lookup_key || offering.id,
      productId: offering.id,
      isFree: true,
      startDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: oneYearFromNow,
      nextRenewalDate: oneYearFromNow,
      cancelAtPeriodEnd: false,
      store: 'default',
      entitlements: {},
      customerId: email
    };
  }

  /**
   * Map RevenueCat subscription to mobile subscription data
   */
  private _mapToMobileSubscriptionData(
    subscription: RevenueCatSubscription,
    entitlements: Record<string, RevenueCatEntitlement>,
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
      isFree: false,
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
}

// Export singleton instance
export const revenueCatHandler = new RevenueCatPaymentHandler();

// Export types for use in other modules
export type {
  RevenueCatCustomer,
  RevenueCatSubscription,
  RevenueCatEntitlement,
  RevenueCatOffering,
  RevenueCatPackage,
  RevenueCatProduct
};