import { Request, Response } from 'express';
import { getUserSubscriptionData } from '../billingService';

export async function getWordUsageStats(req: Request, res: Response) {
  try {
    const userId = req.session.userId!;
    const billingData = await getUserSubscriptionData(userId);
    
    return res.json({
      currentMonthUsage: billingData.currentUsage,
      wordLimitPercentage: Math.min(100, Math.round((billingData.currentUsage / billingData.stripeWordLimit) * 100)),
      history: [],
      billingCycle: billingData.billingCycle ? {
        startDate: new Date(billingData.billingCycle.start).toISOString().split('T')[0],
        endDate: new Date(billingData.billingCycle.end).toISOString().split('T')[0],
        daysRemaining: Math.ceil((new Date(billingData.billingCycle.end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        cycleNumber: 1
      } : null,
      subscriptionPlan: {
        monthlyWordLimit: billingData.stripeWordLimit
      }
    });
  } catch (error) {
    console.error("Error fetching word usage:", error);
    return res.status(500).json({ message: "Failed to retrieve word usage data" });
  }
}