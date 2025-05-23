import { getUserBillingCycle, getUserWordLimit } from "./paymentServiceHandler";
import { storage } from "./storage";

export interface BillingData {
  user: any;
  currentUsage: number;
  billingCycle: { start: Date; end: Date } | null;
  stripeWordLimit: number;
  stripeWordLimitError: string | null;
}

export interface BillingCycleInfo {
  daysRemaining: number;
  cycleStartDate: string;
  cycleEndDate: string;
}

/**
 * Get user subscription data from authentic sources only
 */
export async function getUserSubscriptionData(userId: number): Promise<BillingData> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const currentUsage = await storage.getCurrentWordUsage(userId);
  const billingCycle = await getUserBillingCycle(userId);
  
  let stripeWordLimit = 0;
  let stripeWordLimitError = null;
  
  try {
    if (user.stripeCustomerId && user.stripeSubscriptionId) {
      stripeWordLimit = await getUserWordLimit(userId);
      console.log("Got word limit from Stripe:", stripeWordLimit);
    }
  } catch (error) {
    console.error("Error getting word limit from Stripe:", error);
    stripeWordLimitError = error.message;
  }

  return {
    user,
    currentUsage,
    billingCycle,
    stripeWordLimit,
    stripeWordLimitError
  };
}

/**
 * Calculate billing cycle information for display
 */
export function calculateBillingCycleInfo(billingCycle: { start: Date; end: Date } | null): BillingCycleInfo {
  let daysRemaining = 0;
  let cycleStartDate = '';
  let cycleEndDate = '';
  
  if (billingCycle) {
    const now = new Date();
    const endDate = new Date(billingCycle.end);
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Format dates for frontend display
    cycleStartDate = new Date(billingCycle.start).toISOString().split('T')[0];
    cycleEndDate = new Date(billingCycle.end).toISOString().split('T')[0];
  }

  // Ensure positive days remaining
  daysRemaining = Math.max(0, daysRemaining);

  return {
    daysRemaining,
    cycleStartDate,
    cycleEndDate
  };
}

/**
 * Calculate usage percentage based on word limit
 */
export function calculateUsagePercentage(currentUsage: number, wordLimit: number): number {
  return wordLimit > 0 
    ? Math.min(100, Math.round((currentUsage / wordLimit) * 100))
    : 0;
}