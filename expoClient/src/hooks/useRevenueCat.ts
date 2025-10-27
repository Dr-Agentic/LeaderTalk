import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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

  // Get current subscription - server-side
  const subscriptionQuery = useQuery({
    queryKey: ['server', 'subscription'],
    queryFn: async (): Promise<MobileSubscriptionData> => {
      const response = await fetch(`${API_URL}/api/mobile/billing/subscription`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!user?.email,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Get available products from server (replaces RevenueCat getOfferings)
  const productsQuery = useQuery({
    queryKey: ['server', 'products'],
    queryFn: async (): Promise<MobileBillingProduct[]> => {
      const response = await fetch(`${API_URL}/api/mobile/billing/products`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!user?.email,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Purchase mutation - full server-side billing
  const purchaseMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      // Server-side purchase processing for all platforms
      const response = await fetch(`${API_URL}/api/mobile/billing/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });
      
      if (!response.ok) {
        throw new Error(`Purchase failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'subscription'] });
      queryClient.invalidateQueries({ queryKey: ['server', 'products'] });
    },
  });

  // Restore mutation - server-side
  const restoreMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/mobile/billing/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Restore failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server', 'subscription'] });
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
  
