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
 * Helper function to calculate analytics from usage report data
 */
function calculateCycleAnalytics(usageReport: any, wordLimit: number) {
  const usagePercentage = wordLimit > 0 
    ? Math.round((usageReport.totalWordCount / wordLimit) * 100)
    : 0;

  const remainingWords = Math.max(0, wordLimit - usageReport.totalWordCount);
  const hasExceededLimit = usageReport.totalWordCount > wordLimit;
  
  const averageWordsPerRecording = usageReport.recordingCount > 0 
    ? Math.round(usageReport.totalWordCount / usageReport.recordingCount)
    : 0;

  const totalRecordingDuration = usageReport.recordings.reduce((sum: number, recording: any) => sum + recording.duration, 0);
  const averageDurationPerRecording = usageReport.recordingCount > 0
    ? Math.round(totalRecordingDuration / usageReport.recordingCount)
    : 0;

  return {
    usagePercentage,
    remainingWords,
    hasExceededLimit,
    averageWordsPerRecording,
    totalRecordingDuration,
    averageDurationPerRecording,
  };
}

/**
 * Helper function to calculate billing cycle dates based on interval
 */
function calculateHistoricalCycleDates(currentPeriodStart: Date, interval: string, cycleNumber: number) {
  let cycleStart: Date;
  let cycleEnd: Date;
  
  if (interval === 'month') {
    // Monthly cycles
    cycleEnd = new Date(currentPeriodStart);
    cycleEnd.setMonth(cycleEnd.getMonth() - cycleNumber);
    cycleEnd.setTime(cycleEnd.getTime() - 1); // End of previous cycle
    
    cycleStart = new Date(cycleEnd);
    cycleStart.setMonth(cycleStart.getMonth());
    cycleStart.setDate(1);
    cycleStart.setHours(0, 0, 0, 0);
  } else {
    // Yearly cycles
    cycleEnd = new Date(currentPeriodStart);
    cycleEnd.setFullYear(cycleEnd.getFullYear() - cycleNumber);
    cycleEnd.setTime(cycleEnd.getTime() - 1);
    
    cycleStart = new Date(cycleEnd);
    cycleStart.setFullYear(cycleStart.getFullYear());
    cycleStart.setMonth(0);
    cycleStart.setDate(1);
    cycleStart.setHours(0, 0, 0, 0);
  }
  
  return { cycleStart, cycleEnd };
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

    // 4. Calculate comprehensive analytics using shared helper
    const analytics = calculateCycleAnalytics(usageReport, subscriptionData.wordLimit);

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
      analytics,
    };

    console.log(`📊 Analytics: ${analytics.usagePercentage}% used (${usageReport.totalWordCount}/${subscriptionData.wordLimit} words)`);
    console.log(`🎙️ Recordings: ${usageReport.recordingCount} total, ${analytics.averageWordsPerRecording} avg words/recording`);
    
    return result;
  } catch (error) {
    console.error("❌ Error generating subscription management report:", error);
    throw new Error(`Failed to generate subscription management report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate billing cycle word usage history across multiple cycles for trend analysis
 * @param userId - User ID to analyze
 * @param numberOfCycles - Number of billing cycles to analyze (including current)
 * @returns Historical usage data with trend analytics across multiple billing periods
 */
export async function getBillingCycleWordUsageHistory(userId: number, numberOfCycles: number = 3): Promise<{
  userId: number;
  cyclesAnalyzed: number;
  generatedAt: Date;
  currentCycle: {
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
  };
  historicalCycles: Array<{
    cycleNumber: number;
    startDate: Date;
    endDate: Date;
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
      averageWordsPerRecording: number;
      totalRecordingDuration: number;
      averageDurationPerRecording: number;
    };
  }>;
  trendAnalytics: {
    totalWordsAcrossCycles: number;
    averageWordsPerCycle: number;
    usageTrend: "increasing" | "decreasing" | "stable";
    cycleComparison: Array<{
      cycle: string;
      words: number;
      change: string;
    }>;
  };
}> {
  try {
    console.log(`🔍 Generating ${numberOfCycles}-cycle word usage history for user ${userId}`);

    // Get current cycle analytics first
    const currentCycleAnalytics = await getBillingCycleWordUsageAnalytics(userId);
    
    // Calculate historical cycle periods
    const historicalCycles = [];
    const currentPeriodStart = currentCycleAnalytics.subscription.currentPeriodStart;
    const interval = currentCycleAnalytics.subscription.interval;
    
    // Import database storage for historical data
    const { dbStorage } = await import("./dbStorage.js");
    
    // Calculate previous cycles based on interval using shared helper
    for (let cycleNumber = 1; cycleNumber < numberOfCycles; cycleNumber++) {
      const { cycleStart, cycleEnd } = calculateHistoricalCycleDates(currentPeriodStart, interval, cycleNumber);
      
      console.log(`📅 Analyzing cycle ${cycleNumber}: ${cycleStart.toISOString()} to ${cycleEnd.toISOString()}`);
      
      // Get usage data for this historical cycle
      const usageReport = await dbStorage.wordUsageReport(cycleStart, cycleEnd, userId);
      
      // Calculate analytics for this cycle using shared helper (excluding some fields for historical data)
      const fullAnalytics = calculateCycleAnalytics(usageReport, currentCycleAnalytics.subscription.wordLimit);
      const analytics = {
        usagePercentage: fullAnalytics.usagePercentage,
        averageWordsPerRecording: fullAnalytics.averageWordsPerRecording,
        totalRecordingDuration: fullAnalytics.totalRecordingDuration,
        averageDurationPerRecording: fullAnalytics.averageDurationPerRecording,
      };
      
      historicalCycles.push({
        cycleNumber,
        startDate: cycleStart,
        endDate: cycleEnd,
        usageReport,
        analytics,
      });
    }
    
    // Calculate trend analytics
    const allCycles = [
      { cycle: "current", words: currentCycleAnalytics.usageReport.totalWordCount },
      ...historicalCycles.map(cycle => ({ 
        cycle: `${cycle.cycleNumber}_cycles_ago`, 
        words: cycle.usageReport.totalWordCount 
      }))
    ];
    
    const totalWordsAcrossCycles = allCycles.reduce((sum, cycle) => sum + cycle.words, 0);
    const averageWordsPerCycle = Math.round(totalWordsAcrossCycles / allCycles.length);
    
    // Determine usage trend
    let usageTrend: "increasing" | "decreasing" | "stable" = "stable";
    if (allCycles.length >= 2) {
      const currentWords = allCycles[0].words;
      const previousWords = allCycles[1].words;
      const threshold = averageWordsPerCycle * 0.1; // 10% threshold
      
      if (currentWords > previousWords + threshold) {
        usageTrend = "increasing";
      } else if (currentWords < previousWords - threshold) {
        usageTrend = "decreasing";
      }
    }
    
    // Calculate cycle comparison with percentage changes
    const cycleComparison = allCycles.map((cycle, index) => {
      let change = "0%";
      if (index > 0) {
        const previousCycle = allCycles[index - 1];
        const percentChange = previousCycle.words > 0 
          ? Math.round(((cycle.words - previousCycle.words) / previousCycle.words) * 100)
          : 0;
        change = percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`;
      }
      
      return {
        cycle: cycle.cycle,
        words: cycle.words,
        change,
      };
    });
    
    const result = {
      userId,
      cyclesAnalyzed: numberOfCycles,
      generatedAt: new Date(),
      currentCycle: currentCycleAnalytics,
      historicalCycles,
      trendAnalytics: {
        totalWordsAcrossCycles,
        averageWordsPerCycle,
        usageTrend,
        cycleComparison,
      },
    };
    
    console.log(`📊 History Analysis: ${totalWordsAcrossCycles} total words across ${numberOfCycles} cycles (${usageTrend} trend)`);
    
    return result;
  } catch (error) {
    console.error("❌ Error generating billing cycle usage history:", error);
    throw new Error(`Failed to generate billing cycle usage history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}