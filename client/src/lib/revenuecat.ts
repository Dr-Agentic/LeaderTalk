import { queryClient } from './queryClient';

// Define a global window type that includes the RevenueCat Purchases object
declare global {
  interface Window {
    Purchases: any;
    RevenueCat: any;
  }
}

// RevenueCat configuration
const RC_PUBLIC_SDK_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;

// Initialize RevenueCat when the app starts
export async function initializeRevenueCat() {
  try {
    if (!RC_PUBLIC_SDK_KEY) {
      console.error('RevenueCat public SDK key is missing');
      return false;
    }

    // Check for the Web SDK (loaded via script tag in index.html)
    if (window.RevenueCat) {
      console.log('Using RevenueCat Web SDK');
      await window.RevenueCat.configure({
        apiKey: RC_PUBLIC_SDK_KEY,
        appUserID: undefined,
        observerMode: false
      });
      console.log('RevenueCat Web SDK initialized successfully');
      
      // Check if user is already logged in and identify them
      const userId = localStorage.getItem('userId');
      if (userId) {
        await identifyUser(userId);
      }
      
      return true;
    } 
    // Fallback to mobile SDK (if available)
    else if (window.Purchases) {
      console.log('Using RevenueCat Mobile SDK');
      await window.Purchases.configure({
        apiKey: RC_PUBLIC_SDK_KEY,
        appUserID: undefined,
        observerMode: false
      });
      
      console.log('RevenueCat Mobile SDK initialized successfully');
      
      // Check if user is already logged in and identify them
      const userId = localStorage.getItem('userId');
      if (userId) {
        await identifyUser(userId);
      }
      
      return true;
    } else {
      console.error('RevenueCat SDK not available');
      return false;
    }
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    return false;
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
    // For Web SDK
    if (window.RevenueCat) {
      await window.RevenueCat.login(userId);
      console.log('User identified with RevenueCat Web SDK:', userId);
      return true;
    }
    // For Mobile SDK
    else if (window.Purchases) {
      await window.Purchases.identify(userId);
      console.log('User identified with RevenueCat Mobile SDK:', userId);
      return true;
    } else {
      console.error('RevenueCat SDK not available');
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
    // For Web SDK
    if (window.RevenueCat) {
      const offerings = await window.RevenueCat.getOfferings();
      console.log('RevenueCat Web SDK offerings:', offerings);
      return offerings.current?.availablePackages || [];
    }
    // For Mobile SDK
    else if (window.Purchases) {
      const offerings = await window.Purchases.getOfferings() as RevenueCatOfferings;
      console.log('RevenueCat Mobile SDK offerings:', offerings);
      return offerings.current?.availablePackages || [];
    } else {
      console.error('RevenueCat SDK not available');
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
    // For Web SDK
    if (window.RevenueCat) {
      const customerInfo = await window.RevenueCat.getCustomerInfo();
      console.log('RevenueCat Web SDK customer info:', customerInfo);
      return customerInfo;
    }
    // For Mobile SDK
    else if (window.Purchases) {
      const customerInfo = await window.Purchases.getCustomerInfo() as RevenueCatCustomerInfo;
      console.log('RevenueCat Mobile SDK customer info:', customerInfo);
      return customerInfo;
    } else {
      console.error('RevenueCat SDK not available');
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
    // For Web SDK
    if (window.RevenueCat) {
      const customerInfo = await window.RevenueCat.purchasePackage(packageToPurchase.identifier);
      console.log('Purchase successful with Web SDK:', customerInfo);
      
      // Invalidate the subscription cache to reload user's entitlements
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      return { success: true, customerInfo };
    }
    // For Mobile SDK
    else if (window.Purchases) {
      const { customerInfo } = await window.Purchases.purchasePackage(packageToPurchase);
      console.log('Purchase successful with Mobile SDK:', customerInfo);
      
      // Invalidate the subscription cache to reload user's entitlements
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      return { success: true, customerInfo };
    } else {
      console.error('RevenueCat SDK not available');
      return { success: false, error: 'RevenueCat SDK not available' };
    }
  } catch (error) {
    console.error('Error purchasing package:', error);
    return { success: false, error };
  }
}

// Check if user has an active subscription
export async function checkSubscriptionStatus() {
  try {
    // For Web SDK
    if (window.RevenueCat) {
      const customerInfo = await window.RevenueCat.getCustomerInfo();
      const activeSubscription = Object.values(customerInfo.entitlements.active).length > 0;
      
      return {
        isSubscribed: activeSubscription,
        plan: activeSubscription ? getPlanFromEntitlements(customerInfo.entitlements.active) : 'none',
        customerInfo
      };
    }
    // For Mobile SDK
    else if (window.Purchases) {
      const customerInfo = await window.Purchases.getCustomerInfo() as RevenueCatCustomerInfo;
      const activeSubscription = Object.values(customerInfo.entitlements.active).length > 0;
      
      return {
        isSubscribed: activeSubscription,
        plan: activeSubscription ? getPlanFromEntitlements(customerInfo.entitlements.active) : 'none',
        customerInfo
      };
    } else {
      console.error('RevenueCat SDK not available');
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

// Restore purchases
export async function restorePurchases() {
  try {
    // For Web SDK
    if (window.RevenueCat) {
      const customerInfo = await window.RevenueCat.restorePurchases();
      
      // Invalidate queries to refresh UI with restored purchases
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      return { success: true, customerInfo };
    }
    // For Mobile SDK
    else if (window.Purchases) {
      const customerInfo = await window.Purchases.restorePurchases();
      
      // Invalidate queries to refresh UI with restored purchases
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      return { success: true, customerInfo };
    } else {
      console.error('RevenueCat SDK not available');
      return { success: false, error: 'RevenueCat SDK not available' };
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