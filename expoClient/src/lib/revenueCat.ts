import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PURCHASES_ERROR_CODE 
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { fetchAuthParameters } from './api';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(userId?: string): Promise<boolean> {
    try {
      // Fetch API keys from server
      const authParams = await fetchAuthParameters();
      
      const apiKey = Platform.select({
        ios: authParams.revenueCat?.iosApiKey,
        android: authParams.revenueCat?.androidApiKey,
      });

      if (!apiKey) {
        console.warn('RevenueCat API key not available from server');
        return false;
      }

      await Purchases.configure({ apiKey });
      
      if (userId) {
        await Purchases.logIn(userId);
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully with key:', apiKey.slice(0, 8) + '...');
      return true;
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      return false;
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error: any) {
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED) {
        console.log('Purchase was cancelled');
        return null;
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async logIn(userId: string): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return customerInfo;
    } catch (error) {
      console.error('Failed to log in user:', error);
      throw error;
    }
  }

  async logOut(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.logOut();
      return customerInfo;
    } catch (error) {
      console.error('Failed to log out user:', error);
      throw error;
    }
  }

  // Helper method to check if user has active subscription
  hasActiveSubscription(customerInfo: CustomerInfo): boolean {
    return Object.keys(customerInfo.activeSubscriptions).length > 0;
  }

  // Helper method to get active entitlements
  getActiveEntitlements(customerInfo: CustomerInfo): string[] {
    return Object.keys(customerInfo.entitlements.active);
  }
}

export const revenueCatService = RevenueCatService.getInstance();

// Product identifiers that should match your App Store Connect configuration
export const REVENUECAT_PRODUCT_IDS = {
  EXECUTIVE_MONTHLY: 'com.leadertalk.app.ios.subscription.executive.monthly',
  EXECUTIVE_YEARLY: 'com.leadertalk.app.ios.subscription.executive.yearly',
};