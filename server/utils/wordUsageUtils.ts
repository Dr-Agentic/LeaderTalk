import { Request, Response } from "express";
import { getUserSubscriptionData } from "../subscriptionController";

// Export for route handlers
export async function getWordUsageStatistics(userId: number) {
  const billingData = await getUserSubscriptionData(userId);

  return {
    currentMonthUsage: billingData.currentUsage,
    wordLimitPercentage: Math.min(
      100,
      Math.round(
        (billingData.currentUsage / billingData.stripeWordLimit) * 100,
      ),
    ),
    history: [],
    billingCycle: billingData.billingCycle
      ? {
          startDate: new Date(billingData.billingCycle.start)
            .toISOString()
            .split("T")[0],
          endDate: new Date(billingData.billingCycle.end)
            .toISOString()
            .split("T")[0],
          startDate_Exact: billingData.billingCycle.start,
          endDate_Exact: billingData.billingCycle.end,
          daysRemaining: Math.ceil(
            (new Date(billingData.billingCycle.end).getTime() -
              new Date().getTime() -
              1) /
              (1000 * 60 * 60 * 24),
          ),
          cycleNumber: 1,
        }
      : null,
    subscriptionPlan: {
      monthlyWordLimit: billingData.stripeWordLimit,
    },
  };
}

// Export for billing cycle queries
export async function getBillingCycleForUser(userId: number) {
  const billingData = await getUserSubscriptionData(userId);
  return billingData.billingCycle;
}
