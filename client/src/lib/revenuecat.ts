import { Purchases } from '@revenuecat/purchases-js';
import { queryClient } from './queryClient';

// RevenueCat configuration
const RC_PUBLIC_SDK_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

// Initialize RevenueCat when the app starts
export async function initializeRevenueCat() {
  try {
    if (!RC_PUBLIC_SDK_KEY) {
      console.error('RevenueCat public SDK key is missing');
      return;
    }

    await Purchases.configure({
      apiKey: RC_PUBLIC_SDK_KEY,
      appUserID: undefined, // Optional user ID
      observerMode: false, // Set to true to prevent making purchases
      useAmazon: false, // Set to true to use Amazon as the store
    });
    
    console.log('RevenueCat SDK initialized successfully');
    
    // Check if user is already logged in and identify them
    const userId = localStorage.getItem('userId');
    if (userId) {
      await identifyUser(userId);
    }
    
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
}

// Type definitions to match RevenueCat API
interface RevenueCatCustomerInfo {
  entitlements: {
    active: Record<string, any>;
    all: Record<string, any>;
  };
  originalAppUserId: string;
  managementURL: string;
  originalApplicationVersion: string | null;
  originalPurchaseDate: string | null;
  firstSeen: string;
  nonSubscriptionTransactions: any[];
  // Add other properties as needed
}

interface RevenueCatOfferings {
  current: {
    identifier: string;
    availablePackages: any[];
  } | null;
  all: Record<string, any>;
}

// Identify a user with RevenueCat for subscription tracking
export async function identifyUser(userId: string) {
  try {
    // Ensure Purchases.identify is properly typed
    if (typeof Purchases.identify === 'function') {
      await Purchases.identify(userId);
      console.log('User identified with RevenueCat:', userId);
      return true;
    } else {
      console.error('Purchases.identify is not available');
      return false;
    }
  } catch (error) {
    console.error('Error identifying user with RevenueCat:', error);
    return false;
  }
}

// Get available products
export async function getAvailableProducts() {
  try {
    if (typeof Purchases.getOfferings === 'function') {
      const offerings = await Purchases.getOfferings() as RevenueCatOfferings;
      console.log('RevenueCat offerings:', offerings);
      return offerings.current?.availablePackages || [];
    } else {
      console.error('Purchases.getOfferings is not available');
      return [];
    }
  } catch (error) {
    console.error('Error fetching RevenueCat offerings:', error);
    return [];
  }
}

// Get current subscription status
export async function getCustomerInfo() {
  try {
    if (typeof Purchases.getCustomerInfo === 'function') {
      const customerInfo = await Purchases.getCustomerInfo() as RevenueCatCustomerInfo;
      console.log('RevenueCat customer info:', customerInfo);
      return customerInfo;
    } else {
      console.error('Purchases.getCustomerInfo is not available');
      return null;
    }
  } catch (error) {
    console.error('Error fetching customer info from RevenueCat:', error);
    return null;
  }
}

// Purchase a subscription package
export async function purchasePackage(packageToPurchase: any) {
  try {
    if (typeof Purchases.purchasePackage === 'function') {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('Purchase successful:', customerInfo);
      
      // Invalidate the subscription cache to reload user's entitlements
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      return { success: true, customerInfo };
    } else {
      console.error('Purchases.purchasePackage is not available');
      return { success: false, error: 'Purchase functionality not available' };
    }
  } catch (error) {
    console.error('Error purchasing package:', error);
    return { success: false, error };
  }
}

// Check if user has an active subscription
export async function checkSubscriptionStatus() {
  try {
    if (typeof Purchases.getCustomerInfo === 'function') {
      const customerInfo = await Purchases.getCustomerInfo() as RevenueCatCustomerInfo;
      const activeSubscription = 
        Object.values(customerInfo.entitlements.active).length > 0;
      
      return {
        isSubscribed: activeSubscription,
        plan: activeSubscription ? getPlanFromEntitlements(customerInfo.entitlements.active) : 'none',
        customerInfo
      };
    } else {
      console.error('Purchases.getCustomerInfo is not available');
      return { isSubscribed: false, plan: 'none' };
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isSubscribed: false, plan: 'none', error };
  }
}

// Helper to determine the plan name from active entitlements
function getPlanFromEntitlements(activeEntitlements: Record<string, any>) {
  if (activeEntitlements['executive_plan']) return 'executive';
  if (activeEntitlements['pro_plan']) return 'pro';
  if (activeEntitlements['starter_plan']) return 'starter';
  return 'none';
}

// Restore purchases (useful for mobile platforms)
export async function restorePurchases() {
  try {
    if (typeof Purchases.restorePurchases === 'function') {
      const customerInfo = await Purchases.restorePurchases();
      
      // Invalidate queries to refresh UI with restored purchases
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      return { success: true, customerInfo };
    } else {
      console.error('Purchases.restorePurchases is not available');
      return { success: false, error: 'Restore purchases functionality not available' };
    }
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { success: false, error };
  }
}

// Convert RevenueCat plan to our database plan code
export function mapRevenueCatPlanToDbPlan(rcPlan: string) {
  const planMap: Record<string, string> = {
    'starter_plan': 'starter',
    'pro_plan': 'pro',
    'executive_plan': 'executive'
  };
  
  return planMap[rcPlan] || 'starter';
}