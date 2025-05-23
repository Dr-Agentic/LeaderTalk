import { getUserSubscriptionData } from '../billingService';
import { storage } from '../storage';

export interface WordUsageResponse {
  currentMonthUsage: number;
  wordLimitPercentage: number;
  history: any[];
  billingCycle: {
    startDate: string;
    endDate: string;
    daysRemaining: number;
    cycleNumber: number;
  };
  subscriptionPlan: any;
}

export async function getWordUsageStatistics(userId: number): Promise<WordUsageResponse> {
  const { user, currentUsage, billingCycle, stripeWordLimit } = 
    await getUserSubscriptionData(userId);
  
  // Calculate billing cycle dates
  let daysRemaining = 0;
  let cycleStartDate = '';
  let cycleEndDate = '';
  
  if (billingCycle) {
    const now = new Date();
    const endDate = new Date(billingCycle.end);
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    cycleStartDate = new Date(billingCycle.start).toISOString().split('T')[0];
    cycleEndDate = new Date(billingCycle.end).toISOString().split('T')[0];
  } else {
    // Fallback calculation using registration date
    const registrationDate = new Date(user.createdAt);
    const now = new Date();
    const billingDay = registrationDate.getDate();
    
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(billingDay);
    
    if (now.getDate() >= billingDay) {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    
    daysRemaining = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    cycleEndDate = nextBillingDate.toISOString().split('T')[0];
    
    const cycleStartDateObj = new Date(now);
    cycleStartDateObj.setDate(billingDay);
    if (now.getDate() < billingDay) {
      cycleStartDateObj.setMonth(cycleStartDateObj.getMonth() - 1);
    }
    cycleStartDate = cycleStartDateObj.toISOString().split('T')[0];
  }
  
  // Ensure valid dates
  if (!cycleStartDate) {
    cycleStartDate = new Date().toISOString().split('T')[0];
  }
  if (!cycleEndDate) {
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
    cycleEndDate = defaultEndDate.toISOString().split('T')[0];
  }
  
  daysRemaining = Math.max(0, daysRemaining);
  
  // Get historical usage data
  const usageHistory = await storage.getUserWordUsage(userId);
  const formattedHistory = usageHistory.map(cycle => ({
    month: `${cycle.year}-${cycle.month.toString().padStart(2, '0')}`,
    wordCount: cycle.wordCount,
    cycleNumber: cycle.cycleNumber || 1
  }));
  
  // Calculate word limit percentage
  const wordLimitPercentage = stripeWordLimit > 0 ? 
    Math.min(100, (currentUsage / stripeWordLimit) * 100) : 100;
  
  // Create subscription plan object
  const modifiedSubscriptionPlan = stripeWordLimit > 0 ? {
    id: 1,
    name: "Stripe Subscription",
    planCode: "stripe_plan",
    monthlyWordLimit: stripeWordLimit,
    monthlyPriceUsd: "N/A",
    yearlyPriceUsd: "N/A",
    features: [`${stripeWordLimit.toLocaleString()} words per month`],
    isDefault: false
  } : null;
  
  return {
    currentMonthUsage: currentUsage,
    wordLimitPercentage,
    history: formattedHistory,
    billingCycle: {
      startDate: cycleStartDate,
      endDate: cycleEndDate,
      daysRemaining,
      cycleNumber: 1
    },
    subscriptionPlan: modifiedSubscriptionPlan
  };
}