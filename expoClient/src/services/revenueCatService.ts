/**
 * RevenueCat Service for Mobile In-App Purchases
 * Handles all RevenueCat SDK interactions and subscription management
 * 
 * API Requirements:
 * - EXPO_PUBLIC_REVENUECAT_API_KEY: Production RevenueCat API key
 * - EXPO_PUBLIC_REVENUECAT_API_KEY_SANDBOX: Sandbox RevenueCat API key
 * 
 * Expected Flow:
 * 1. Initialize with user ID
 * 2. Fetch available products/offerings
 * 3. Handle purchase/restore flows
 * 4. Sync subscription state with backend
 */

// Mock types for development - replace with actual imports when package is installed
interface PurchasesOffering {
  identifier: string;
  serverDescription: string;
  availablePackages: PurchasesPackage[];
}

interface EntitlementInfo {
  identifier: string;
  productIdentifier: string;
  isActive: boolean;
  willRenew: boolean;
  expirationDate?: string;
}

interface SubscriptionInfo {
  productIdentifier: string;
  purchaseDate: string;
  store: string;
  price: string;
  periodType: string;
}

interface CustomerInfo {
  originalAppUserId: string;
  entitlements: {
    active: Record<string, EntitlementInfo>;
  };
  activeSubscriptions: SubscriptionInfo[];
}

interface PurchasesPackage {
  identifier: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: string;
    priceString: string;
    subscriptionPeriod?: string;
  };
}

// Mock Purchases object for development
const Purchases = {
  configure: async ({ apiKey, appUserID }: { apiKey: string; appUserID: string }) => {
    console.log('RevenueCat configured for user:', appUserID);
  },
  getCustomerInfo: async (): Promise<CustomerInfo> => {
    throw new Error('RevenueCat not initialized');
  },
  getOfferings: async () => ({
    all: {} as Record<string, PurchasesOffering>,
    current: null as PurchasesOffering | null,
  }),
  purchasePackage: async (pkg: PurchasesPackage) => ({
    customerInfo: {} as CustomerInfo,
  }),
  restorePurchases: async (): Promise<CustomerInfo> => {
    throw new Error('RevenueCat not initialized');
  },
};

export interface MobileSubscriptionData {
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
  // Formatted display fields
  formattedAmount?: string;
  formattedInterval?: string;
  formattedStartDate?: string;
  formattedCurrentPeriod?: string;
  formattedNextRenewal?: string;
  formattedUsage?: string;
  formattedStatus?: string;
  statusColor?: string;
  usagePercentage?: number;
  wordLimit?: number;
  currentUsage?: number;
  daysRemaining?: number;
  formattedDaysRemaining?: string;
}

export interface MobileBillingProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  productIcon: string | null;
  pricing: {
    amount: number;
    formattedPrice: string;
    formattedSavings?: string;
    interval: string;
    productId: string; // RevenueCat product identifier
  };
  features: {
    wordLimit: number;
    maxRecordingLength: number;
    leaderLibraryAccess: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
  isDefault: boolean;
  isPopular: boolean;
  billingType: string;
}

class RevenueCatService {
  private isInitialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = process.env.NODE_ENV === 'development'
        ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_SANDBOX || ''
        : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

      if (!apiKey) {
        throw new Error('RevenueCat API key not configured');
      }

      await Purchases.configure({ apiKey, appUserID: userId });
      this.isInitialized = true;
      
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get current customer info and subscription status
   */
  async getCurrentSubscription(): Promise<MobileSubscriptionData> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      console.error('Error getting current subscription:', error);
      throw error;
    }
  }

  /**
   * Get available offerings and products
   * 
   * @returns Array of MobileBillingProduct with pricing and features
   * Expected structure: [{ id, code, name, description, pricing: { amount, formattedPrice, interval, productId }, features: { wordLimit, ... } }]
   */
  async getAvailableProducts(): Promise<MobileBillingProduct[]> {
    try {
      const offerings = await Purchases.getOfferings();
      const products: MobileBillingProduct[] = [];

      // Convert RevenueCat offerings to our product format
      Object.values(offerings.all).forEach((offering: PurchasesOffering) => {
        offering.availablePackages.forEach((pkg: PurchasesPackage) => {
          products.push(this.mapPackageToProduct(pkg, offering));
        });
      });

      return products;
    } catch (error) {
      console.error('Error getting available products:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<MobileSubscriptionData> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      console.error('Error purchasing package:', error);
      throw error;
    }
  }

  /**
   * Restore purchases for existing users
   */
  async restorePurchases(): Promise<MobileSubscriptionData> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.mapCustomerInfoToSubscription(customerInfo);
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has any active entitlements
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Map RevenueCat CustomerInfo to our subscription format
   */
  private mapCustomerInfoToSubscription(customerInfo: CustomerInfo): MobileSubscriptionData {
    const activeEntitlements = customerInfo.entitlements.active;
    const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;

    if (!hasActiveSubscription) {
      // Return default free subscription
      return this.createDefaultSubscription(customerInfo.originalAppUserId);
    }

    // Get the primary entitlement (first active one)
    const primaryEntitlement = Object.values(activeEntitlements)[0];
    const subscription = customerInfo.activeSubscriptions[0];

    const now = new Date();
    const expirationDate = primaryEntitlement.expirationDate ? new Date(primaryEntitlement.expirationDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const startDate = subscription?.purchaseDate ? new Date(subscription.purchaseDate) : now;

    return {
      id: subscription?.productIdentifier || 'mobile_default',
      status: primaryEntitlement.isActive ? 'active' : 'inactive',
      plan: primaryEntitlement.identifier,
      planId: primaryEntitlement.identifier,
      productId: primaryEntitlement.productIdentifier,
      isFree: false,
      startDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: expirationDate,
      nextRenewalDate: expirationDate,
      cancelAtPeriodEnd: primaryEntitlement.willRenew === false,
      store: subscription?.store || 'app_store',
      entitlements: activeEntitlements,
      customerId: customerInfo.originalAppUserId,
      // Add formatted fields
      formattedAmount: subscription?.price ? `$${subscription.price}` : '$0.00',
      formattedInterval: this.getIntervalFromPeriod(subscription?.periodType),
      formattedStatus: primaryEntitlement.isActive ? 'Active' : 'Inactive',
      statusColor: primaryEntitlement.isActive ? '#10B981' : '#EF4444',
    };
  }

  /**
   * Map RevenueCat Package to our product format
   */
  private mapPackageToProduct(pkg: PurchasesPackage, offering: PurchasesOffering): MobileBillingProduct {
    const product = pkg.product;
    
    return {
      id: pkg.identifier,
      code: pkg.identifier,
      name: product.title,
      description: product.description,
      productIcon: null,
      pricing: {
        amount: parseFloat(product.price) * 100, // Convert to cents
        formattedPrice: product.priceString,
        interval: this.getIntervalFromPeriod(product.subscriptionPeriod),
        productId: product.identifier,
      },
      features: this.getFeaturesByPackage(pkg.identifier),
      isDefault: offering.identifier === 'default',
      isPopular: pkg.identifier.includes('popular'),
      billingType: 'mobile',
    };
  }

  /**
   * Create default free subscription for users without active subscriptions
   */
  private createDefaultSubscription(userId: string): MobileSubscriptionData {
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      id: 'mobile_starter_default',
      status: 'active',
      plan: 'LeaderTalk Starter',
      planId: 'starter',
      productId: 'starter_free',
      isFree: true,
      startDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: oneYearFromNow,
      nextRenewalDate: oneYearFromNow,
      cancelAtPeriodEnd: false,
      store: 'mobile_default',
      entitlements: {},
      customerId: userId,
      formattedAmount: 'Free',
      formattedInterval: '',
      formattedStatus: 'Active (Free)',
      statusColor: '#10B981',
      wordLimit: 500,
      currentUsage: 0,
      usagePercentage: 0,
    };
  }

  /**
   * Convert subscription period to display interval
   */
  private getIntervalFromPeriod(period?: string): string {
    switch (period) {
      case 'P1M':
        return '/month';
      case 'P1Y':
        return '/year';
      case 'P1W':
        return '/week';
      default:
        return '';
    }
  }

  /**
   * Get features based on package identifier
   */
  private getFeaturesByPackage(packageId: string): MobileBillingProduct['features'] {
    // This would typically come from your backend or RevenueCat metadata
    const defaultFeatures = {
      wordLimit: 500,
      maxRecordingLength: 300,
      leaderLibraryAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
    };

    switch (packageId.toLowerCase()) {
      case 'premium':
      case 'monthly':
        return {
          ...defaultFeatures,
          wordLimit: 5000,
          maxRecordingLength: 1800,
          leaderLibraryAccess: true,
          advancedAnalytics: true,
        };
      case 'pro':
      case 'annual':
        return {
          ...defaultFeatures,
          wordLimit: 10000,
          maxRecordingLength: 3600,
          leaderLibraryAccess: true,
          advancedAnalytics: true,
          prioritySupport: true,
        };
      default:
        return defaultFeatures;
    }
  }
}

export const revenueCatService = new RevenueCatService();