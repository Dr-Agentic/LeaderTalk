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

/**
 * Generate comprehensive billing cycle word usage analytics combining Stripe subscription data with detailed usage reporting
 * @param userId - User ID to analyze
 * @returns Complete billing cycle analytics with subscription details and word usage breakdown
 */
export async function getBillingCycleWordUsageAnalytics(userId: number): Promise<{
  subscription: {
    id: string;
    status: string;
    plan: string;
    planId: string;
    isFree: boolean;
    startDate: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    wordLimit: number;
    amount: number;
    currency: string;
    interval: string;
  };
  usageReport: {
    totalWordCount: number;
    firstRecordingCreatedAt: Date | null;
    lastRecordingCreatedAt: Date | null;
    recordingCount: number;
    recordings: Array<{
      id: number;
      name: string;
      createdAt: Date;
      wordCount: number;
      duration: number;
      order: number;
    }>;
  };
  analytics: {
    usagePercentage: number;
    remainingWords: number;
    hasExceededLimit: boolean;
    averageWordsPerRecording: number;
    totalRecordingDuration: number;
    averageDurationPerRecording: number;
  };
}> {
  try {
    console.log(`🔍 Generating comprehensive subscription management report for user ${userId}`);

    // Import the payment service handler for authentic subscription data
    const { getUserSubscription } = await import("./paymentServiceHandler.js");
    
    // 1. Retrieve authentic subscription details from Stripe
    const subscriptionData = await getUserSubscription(userId);
    console.log(`✅ Retrieved subscription data: ${subscriptionData.plan} (${subscriptionData.wordLimit} words)`);

    // 2. Calculate subscription period with precise timing (end - 1 millisecond)
    const subscriptionStart = subscriptionData.currentPeriodStart;
    const subscriptionEndExclusive = new Date(subscriptionData.currentPeriodEnd.getTime() - 1);

    console.log(`📅 Subscription period: ${subscriptionStart.toISOString()} to ${subscriptionEndExclusive.toISOString()}`);

    // 3. Fetch word usage report for the exact subscription period
    const { dbStorage } = await import("./dbStorage.js");
    const usageReport = await dbStorage.wordUsageReport(
      subscriptionStart,
      subscriptionEndExclusive,
      userId
    );

    // 4. Calculate comprehensive analytics
    const usagePercentage = subscriptionData.wordLimit > 0 
      ? Math.round((usageReport.totalWordCount / subscriptionData.wordLimit) * 100)
      : 0;

    const remainingWords = Math.max(0, subscriptionData.wordLimit - usageReport.totalWordCount);
    const hasExceededLimit = usageReport.totalWordCount > subscriptionData.wordLimit;
    
    const averageWordsPerRecording = usageReport.recordingCount > 0 
      ? Math.round(usageReport.totalWordCount / usageReport.recordingCount)
      : 0;

    const totalRecordingDuration = usageReport.recordings.reduce((sum, recording) => sum + recording.duration, 0);
    const averageDurationPerRecording = usageReport.recordingCount > 0
      ? Math.round(totalRecordingDuration / usageReport.recordingCount)
      : 0;

    const result = {
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        plan: subscriptionData.plan,
        planId: subscriptionData.planId,
        isFree: subscriptionData.isFree,
        startDate: subscriptionData.startDate,
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        wordLimit: subscriptionData.wordLimit,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        interval: subscriptionData.interval,
      },
      usageReport,
      analytics: {
        usagePercentage,
        remainingWords,
        hasExceededLimit,
        averageWordsPerRecording,
        totalRecordingDuration,
        averageDurationPerRecording,
      },
    };

    console.log(`📊 Analytics: ${usagePercentage}% used (${usageReport.totalWordCount}/${subscriptionData.wordLimit} words)`);
    console.log(`🎙️ Recordings: ${usageReport.recordingCount} total, ${averageWordsPerRecording} avg words/recording`);
    
    return result;
  } catch (error) {
    console.error("❌ Error generating subscription management report:", error);
    throw new Error(`Failed to generate subscription management report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}