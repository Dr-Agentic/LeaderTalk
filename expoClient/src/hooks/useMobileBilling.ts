/**
 * Mobile Billing Hooks for RevenueCat Integration
 * 
 * API Endpoints:
 * - GET /api/mobile/billing/subscription - Current subscription data
 * - GET /api/mobile/billing/products - Available products/plans
 * - POST /api/mobile/billing/purchase - Validate and process purchase
 * - POST /api/mobile/billing/restore - Restore previous purchases
 * 
 * Expected API Responses:
 * - Subscription: { id, status, plan, planId, productId, isFree, startDate, currentPeriodEnd, ... }
 * - Products: [{ id, code, name, description, pricing: { amount, formattedPrice, interval }, features: { wordLimit, ... } }]
 * - Purchase: { success: boolean, subscription?: MobileSubscriptionData, error?: string }
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileSubscriptionData, MobileBillingProduct } from '../services/revenueCatService';
import { API_URL } from '../lib/api';

// Base API URL for mobile billing - use full server URL
const API_BASE = `${API_URL}/api/mobile/billing`;

/**
 * Fetch current user subscription
 * 
 * @returns Query with subscription data including usage, billing cycle, and status
 */
export function useMobileSubscription() {
  return useQuery({
    queryKey: [API_BASE, 'subscription'],
    queryFn: async (): Promise<MobileSubscriptionData> => {
      const response = await fetch(`${API_BASE}/subscription`, {
        credentials: 'include',
      });
      
      console.log('Subscription API Response:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('Full Subscription Response:', responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.statusText}`);
      }
      
      return JSON.parse(responseText);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Fetch available subscription products/plans
 * 
 * @returns Query with array of available products with pricing and features
 */
export function useMobileProducts() {
  return useQuery({
    queryKey: [API_BASE, 'products'],
    queryFn: async (): Promise<MobileBillingProduct[]> => {
      const response = await fetch(`${API_URL}/api/mobile/billing/products`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
}

/**
 * Process in-app purchase validation
 * 
 * Expected payload: { productId: string, transactionId?: string, receipt?: string }
 * Returns: { success: boolean, subscription?: MobileSubscriptionData, error?: string }
 */
export function useMobilePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (purchaseData: {
      productId: string;
      transactionId?: string;
      receipt?: string;
    }): Promise<{
      success: boolean;
      subscription?: MobileSubscriptionData;
      error?: string;
    }> => {
      const response = await fetch(`${API_URL}/api/mobile/billing/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Purchase failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch subscription data after successful purchase
      queryClient.invalidateQueries({ queryKey: [API_BASE, 'subscription'] });
      queryClient.invalidateQueries({ queryKey: [API_BASE, 'products'] });
    },
  });
}

/**
 * Restore previous purchases for account recovery
 * 
 * Returns: { success: boolean, subscription?: MobileSubscriptionData, restoredCount?: number }
 */
export function useMobileRestore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      success: boolean;
      subscription?: MobileSubscriptionData;
      restoredCount?: number;
    }> => {
      const response = await fetch(`${API_URL}/api/mobile/billing/restore`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Restore failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch subscription data after successful restore
      queryClient.invalidateQueries({ queryKey: [API_BASE, 'subscription'] });
    },
  });
}

/**
 * Cancel current subscription (if supported by platform)
 * 
 * Note: iOS and Android have different cancellation flows
 * This may redirect to platform-specific cancellation pages
 */
export function useMobileCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      success: boolean;
      redirectUrl?: string;
      message?: string;
    }> => {
      const response = await fetch(`${API_URL}/api/mobile/billing/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Cancellation failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate subscription data after cancellation
      queryClient.invalidateQueries({ queryKey: [API_BASE, 'subscription'] });
    },
  });
}

/**
 * Get billing usage and analytics
 * 
 * @param cycleId Optional billing cycle ID for historical data
 * @returns Query with usage data, word counts, and analytics
 */
export function useMobileBillingUsage(cycleId?: string) {
  return useQuery({
    queryKey: ['/api/usage/billing-cycle', cycleId],
    queryFn: async (): Promise<{
      currentUsage: number;
      wordLimit: number;
      usagePercentage: number;
      hasExceededLimit: boolean;
      billingCycle: {
        startDate: string;
        endDate: string;
        daysRemaining: number;
      };
    }> => {
      const url = cycleId 
        ? `${API_URL}/api/usage/billing-cycle?cycleId=${cycleId}`
        : `${API_URL}/api/usage/billing-cycle`;
        
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      console.log('Usage API Response:', response.status, response.statusText);
      const responseText = await response.text();
      console.log('Usage Response Body:', responseText.substring(0, 200));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.statusText}`);
      }
      
      const data = JSON.parse(responseText);
      console.log('Usage API Response:', JSON.stringify(data, null, 2));
      
      return data;
    },
    enabled: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}