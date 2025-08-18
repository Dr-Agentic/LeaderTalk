import { useEffect, useState } from 'react';
import { revenueCatService } from '../lib/revenueCat';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

export function useRevenueCat(userId?: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeRevenueCat();
  }, [userId]);

  const initializeRevenueCat = async () => {
    try {
      setLoading(true);
      setError(null);

      const initialized = await revenueCatService.initialize(userId);
      setIsInitialized(initialized);

      if (initialized) {
        // Get customer info and offerings
        const [customerData, offeringsData] = await Promise.all([
          revenueCatService.getCustomerInfo(),
          revenueCatService.getOfferings(),
        ]);

        setCustomerInfo(customerData);
        setOfferings(offeringsData);
      }
    } catch (err) {
      console.error('RevenueCat initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize RevenueCat');
    } finally {
      setLoading(false);
    }
  };

  const purchasePackage = async (packageToPurchase: any) => {
    try {
      const result = await revenueCatService.purchasePackage(packageToPurchase);
      if (result) {
        setCustomerInfo(result);
        return result;
      }
      return null;
    } catch (err) {
      console.error('Purchase error:', err);
      throw err;
    }
  };

  const restorePurchases = async () => {
    try {
      const result = await revenueCatService.restorePurchases();
      setCustomerInfo(result);
      return result;
    } catch (err) {
      console.error('Restore purchases error:', err);
      throw err;
    }
  };

  const hasActiveSubscription = customerInfo 
    ? revenueCatService.hasActiveSubscription(customerInfo)
    : false;

  const activeEntitlements = customerInfo 
    ? revenueCatService.getActiveEntitlements(customerInfo)
    : [];

  return {
    isInitialized,
    customerInfo,
    offerings,
    loading,
    error,
    hasActiveSubscription,
    activeEntitlements,
    purchasePackage,
    restorePurchases,
    refresh: initializeRevenueCat,
  };
}