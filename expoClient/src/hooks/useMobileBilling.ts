/**
 * Mobile Billing Usage Hook (Billing Cycle Data Only)
 * 
 * Note: Subscription and product management moved to useRevenueCat.ts
 * This file now only handles billing usage/analytics data.
 */

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Get billing usage and analytics
 * 
 * @param cycleId Optional billing cycle ID for historical data
 * @returns Query with usage data, word counts, and analytics
 */
export function useMobileBillingUsage(cycleId?: string) {
  const { isAuthenticated } = useAuth();
  
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
    enabled: isAuthenticated, // Only run when authenticated
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
