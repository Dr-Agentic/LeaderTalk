/**
 * DEPRECATED: This file is being replaced by the centralized subscription service.
 * Use server/subscriptionService.ts instead for all subscription operations.
 */

import { getUserWordLimit } from '../paymentServiceHandler';

/**
 * Get word limit for a user's current subscription
 * @deprecated Use getUserWordLimit from subscriptionService instead
 */
export async function getUserSubscriptionWordLimit(userId: number): Promise<number> {
  console.warn('⚠️ getUserSubscriptionWordLimit is deprecated. Use getUserWordLimit from subscriptionService instead.');
  return await getUserWordLimit(userId);
}