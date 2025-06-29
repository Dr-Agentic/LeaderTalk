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
  identifier: string;
  description: string;
  packages: RevenueCatPackage[];
  metadata?: Record<string, any>;
}

interface RevenueCatPackage {
  identifier: string;
  platform_product_identifier: string;
}

interface RevenueCatProduct {
  identifier: string;
  display_name: string;
  category: string;
  trial_duration?: string;
  subscription?: {
    period: string;
    period_unit: string;
  };
}

class RevenueCatPaymentHandler {
  private config: RevenueCatConfig;

  constructor() {
    this.config = {
      secretKey: process.env.REVENUECAT_SECRET_KEY || '',
      publicKey: process.env.REVENUECAT_PUBLIC_KEY || '',
      baseUrl: 'https://api.revenuecat.com/v1'
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
   * Get current offerings (products and packages)
   */
  async getOfferings(): Promise<RevenueCatOffering[]> {
    try {
      const data = await this.makeRequest('/offerings');
      return data.offerings || [];
    } catch (error) {
      console.error('Error fetching RevenueCat offerings:', error);
      throw error;
    }
  }

  /**
   * Get specific package by identifier
   */
  async getPackage(offeringId: string, packageId: string): Promise<RevenueCatPackage | null> {
    try {
      const offerings = await this.getOfferings();
      const offering = offerings.find(o => o.identifier === offeringId);
      if (!offering) return null;
      
      return offering.packages.find(p => p.identifier === packageId) || null;
    } catch (error) {
      console.error('Error fetching RevenueCat package:', error);
      throw error;
    }
  }

  /**
   * Get product information by identifier
   */
  async getProduct(productId: string): Promise<RevenueCatProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${productId}`);
      return data.product || null;
    } catch (error) {
      console.error('Error fetching RevenueCat product:', error);
      return null;
    }
  }

  /**
   * Get customer by app user ID (email-based)
   */
  async getCustomerByEmail(email: string): Promise<RevenueCatCustomer | null> {
    try {
      // Use email as app_user_id for consistency
      const appUserId = encodeURIComponent(email);
      const data = await this.makeRequest(`/subscribers/${appUserId}`);
      return data.subscriber || null;
    } catch (error: any) {
      if (error?.message?.includes('404')) {
        return null; // Customer doesn't exist
      }
      console.error('Error fetching RevenueCat customer:', error);
      throw error;
    }
  }

  /**
   * Create or update customer
   */
  async createOrUpdateCustomer(email: string, attributes?: Record<string, any>): Promise<RevenueCatCustomer> {
    try {
      const appUserId = encodeURIComponent(email);
      const data = await this.makeRequest(`/subscribers/${appUserId}`, {
        method: 'POST',
        body: JSON.stringify({
          app_user_id: appUserId,
          email: email,
          ...attributes
        })
      });
      return data.subscriber;
    } catch (error) {
      console.error('Error creating/updating RevenueCat customer:', error);
      throw error;
    }
  }

  /**
   * Get customer's active subscriptions
   */
  async getCustomerSubscriptions(email: string): Promise<Record<string, RevenueCatSubscription>> {
    try {
      const customer = await this.getCustomerByEmail(email);
      return customer?.subscriptions || {};
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get customer's entitlements
   */
  async getCustomerEntitlements(email: string): Promise<Record<string, RevenueCatEntitlement>> {
    try {
      const customer = await this.getCustomerByEmail(email);
      return customer?.entitlements || {};
    } catch (error) {
      console.error('Error fetching customer entitlements:', error);
      throw error;
    }
  }

  /**
   * Check if customer has active subscription
   */
  async hasActiveSubscription(email: string): Promise<boolean> {
    try {
      const subscriptions = await this.getCustomerSubscriptions(email);
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
   * Get pending subscription changes (scheduled)
   */
  async getPendingSubscriptions(email: string): Promise<any[]> {
    try {
      // RevenueCat doesn't have a direct "pending subscriptions" endpoint
      // This would typically be handled by checking subscription modifications
      // For now, return empty array - will implement based on specific RC features
      return [];
    } catch (error) {
      console.error('Error fetching pending subscriptions:', error);
      throw error;
    }
  }

  /**
   * Grant promotional entitlement
   */
  async grantPromoEntitlement(email: string, entitlementId: string, duration?: string): Promise<void> {
    try {
      const appUserId = encodeURIComponent(email);
      await this.makeRequest(`/subscribers/${appUserId}/entitlements/${entitlementId}/promotional`, {
        method: 'POST',
        body: JSON.stringify({
          duration: duration || 'P1M' // Default to 1 month
        })
      });
    } catch (error) {
      console.error('Error granting promotional entitlement:', error);
      throw error;
    }
  }

  /**
   * Test connection to RevenueCat API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getOfferings();
      return true;
    } catch (error) {
      console.error('RevenueCat connection test failed:', error);
      return false;
    }
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