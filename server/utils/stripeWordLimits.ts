/**
 * Word limit utilities - updated to use clean architecture
 */

import { getUserWordLimit } from '../paymentServiceHandler';

/**
 * Get word limit for a user's current subscription
 */
export async function getUserSubscriptionWordLimit(userId: number): Promise<number> {
  return await getUserWordLimit(userId);
}