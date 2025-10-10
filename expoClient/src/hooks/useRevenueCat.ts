import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { revenueCatService } from '../lib/revenueCat';
import { useAuth } from '../contexts/AuthContext';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// Types matching mobile billing interface
export interface MobileSubscriptionData {
  hasSubscription: boolean;
  subscription: {
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
    formattedAmount?: string;
    formattedInterval?: string;
    formattedStartDate?: string;
    formattedNextRenewal?: string;
    formattedStatus?: string;
  };
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
    productId: string;
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

export function useRevenueCat() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // Get current subscription
  const subscriptionQuery = useQuery({
    queryKey: ['revenuecat', 'subscription'],
    queryFn: async (): Promise<MobileSubscriptionData> => {
      const initialized = await revenueCatService.initialize(user?.email);
      if (!initialized) {
        throw new Error('Failed to initialize RevenueCat');
      }

      const customerInfo = await revenueCatService.getCustomerInfo();
      return transformCustomerInfoToSubscription(customerInfo, user?.email || '');
    },
    enabled: isAuthenticated && !!user?.email,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Get available products
  const productsQuery = useQuery({
    queryKey: ['revenuecat', 'products'],
    queryFn: async (): Promise<MobileBillingProduct[]> => {
      const initialized = await revenueCatService.initialize(user?.email);
      if (!initialized) {
        throw new Error('Failed to initialize RevenueCat');
      }

      const offerings = await revenueCatService.getOfferings();
      return transformOfferingsToProducts(offerings);
    },
    enabled: isAuthenticated && !!user?.email,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const offerings = await revenueCatService.getOfferings();
      const packageToPurchase = findPackageByProductId(offerings, productId);
      
      if (!packageToPurchase) {
        throw new Error(`Product ${productId} not found in offerings`);
      }

      const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
      if (!customerInfo) {
        throw new Error('Purchase was cancelled');
      }

      return transformCustomerInfoToSubscription(customerInfo, user?.email || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenuecat', 'subscription'] });
      queryClient.invalidateQueries({ queryKey: ['revenuecat', 'products'] });
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const customerInfo = await revenueCatService.restorePurchases();
      return transformCustomerInfoToSubscription(customerInfo, user?.email || '');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenuecat', 'subscription'] });
    },
  });

  return {
    // Data matching mobile billing interface
    currentSubscription: subscriptionQuery.data || null,
    products: productsQuery.data || [],
    
    // Actions
    purchaseProduct: purchaseMutation.mutateAsync,
    restorePurchases: restoreMutation.mutateAsync,
    
    // Loading states
    isLoading: subscriptionQuery.isLoading || productsQuery.isLoading,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    
    // Error handling
    error: subscriptionQuery.error?.message || productsQuery.error?.message || null,
    
    // Mutations for compatibility
    purchaseSubscription: purchaseMutation,
    restorePurchasesMutation: restoreMutation,
  };
}

// Transform RevenueCat CustomerInfo to MobileSubscriptionData format
function transformCustomerInfoToSubscription(customerInfo: CustomerInfo, userId: string): MobileSubscriptionData {
  const activeEntitlements = customerInfo.entitlements.active;
  const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;

  if (!hasActiveSubscription) {
    // Return default free subscription
    const now = new Date();
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return {
      hasSubscription: true,
      subscription: {
        id: 'revenuecat_starter_default',
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
        store: 'revenuecat_default',
        entitlements: {},
        customerId: userId,
        formattedAmount: 'Free',
        formattedInterval: '',
        formattedStatus: 'Active (Free)',
        formattedStartDate: now.toLocaleDateString(),
        formattedNextRenewal: oneYearFromNow.toLocaleDateString(),
      },
    };
  }

  // Get primary entitlement
  const primaryEntitlement = Object.values(activeEntitlements)[0];
  const expirationDate = primaryEntitlement.expirationDate ? new Date(primaryEntitlement.expirationDate) : new Date();
  const startDate = new Date(); // RevenueCat doesn't provide start date easily

  return {
    hasSubscription: true,
    subscription: {
      id: primaryEntitlement.productIdentifier,
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
      store: 'app_store',
      entitlements: activeEntitlements,
      customerId: userId,
      formattedAmount: '$9.99', // Would need to get from product info
      formattedInterval: '/month',
      formattedStatus: primaryEntitlement.isActive ? 'Active' : 'Inactive',
      formattedStartDate: startDate.toLocaleDateString(),
      formattedNextRenewal: expirationDate.toLocaleDateString(),
    },
  };
}

// Transform RevenueCat Offerings to MobileBillingProduct format
function transformOfferingsToProducts(offerings: PurchasesOffering[]): MobileBillingProduct[] {
  const products: MobileBillingProduct[] = [];

  offerings.forEach((offering) => {
    offering.availablePackages.forEach((pkg) => {
      const product = pkg.product;
      
      products.push({
        id: pkg.identifier,
        code: pkg.identifier,
        name: product.title,
        description: product.description,
        productIcon: null,
        pricing: {
          amount: parseFloat(product.price) * 100, // Convert to cents
          formattedPrice: product.priceString,
          interval: getIntervalFromPeriod(product.subscriptionPeriod),
          productId: product.identifier,
        },
        features: getFeaturesByPackage(pkg.identifier),
        isDefault: offering.identifier === 'default',
        isPopular: pkg.identifier.includes('popular') || pkg.identifier.includes('monthly'),
        billingType: 'mobile',
      });
    });
  });

  return products;
}

// Helper to find package by product ID
function findPackageByProductId(offerings: PurchasesOffering[], productId: string): PurchasesPackage | null {
  for (const offering of offerings) {
    const pkg = offering.availablePackages.find(p => p.product.identifier === productId);
    if (pkg) return pkg;
  }
  return null;
}

// Helper to convert subscription period to display interval
function getIntervalFromPeriod(period?: string): string {
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

// Helper to get features based on package identifier
function getFeaturesByPackage(packageId: string): MobileBillingProduct['features'] {
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
    case 'executive':
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