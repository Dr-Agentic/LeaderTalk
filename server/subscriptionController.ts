import { Request, Response } from "express";
import { storage } from "./storage";
import {
  getUserSubscription,
  getBillingCycleFromSubscription,
  getUserWordLimit,
  ensureUserHasStripeCustomer,
  createDefaultSubscription,
  getExistingSubscription,
} from "./paymentServiceHandler";

/**
 * Validate user authentication and retrieve user data
 */
async function validateUserAccess(
  req: Request,
): Promise<{ userId: number; user: any }> {
  const userId = (req.session as any).userId;
  if (!userId) {
    throw new Error("Authentication required");
  }

  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return { userId, user };
}

/**
 * Get billing cycle dates for a user from their Stripe subscription
 */
export async function getUserBillingCycle(
  userId: number,
): Promise<{ start: Date; end: Date }> {
  // Get user from database to get their subscription ID
  const user = await storage.getUser(userId);
  if (!user?.stripeSubscriptionId) {
    throw new Error(`User ${userId} has no Stripe subscription ID`);
  }

  // Use the pure Stripe API function
  return getBillingCycleFromSubscription(user.stripeSubscriptionId);
}

export async function getCurrentSubscription(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/json");

  try {
    // Step 1: Validate user access
    const { userId, user } = await validateUserAccess(req);

    // Step 2: Handle missing subscription ID
    if (!user.stripeSubscriptionId) {
      console.log(`🔄 AUTOMATIC SUBSCRIPTION INITIALIZATION TRIGGERED`);
      console.log(
        `📊 User ${userId} (${user.email}) has no Stripe subscription, creating default Starter subscription`,
      );

      try {
        const customerId = await ensureUserHasStripeCustomer(user);
        const subscriptionData = await createDefaultSubscription(
          user,
          customerId,
        );

        return res.status(200).json({
          success: true,
          subscription: subscriptionData,
        });
      } catch (error) {
        console.error("Error creating default subscription:", error);
        // Return minimal fallback data
        return res.status(200).json({
          success: true,
          subscription: {
            plan: "starter",
            status: "active",
            isFree: true,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });
      }
    }

    // Step 3: Retrieve existing subscription
    try {
      let subscriptionData = await getExistingSubscription(
        user.stripeSubscriptionId,
      );

      console.log(
        `✅ Retrieved subscription data: ${subscriptionData.plan} (${subscriptionData.wordLimit} words) ${subscriptionData.status}`,
      );

      // Check if the subscription is active
      if (subscriptionData.status !== "active") {
        subscriptionData = await handleNoValidSubscription(userId);
      }

      return res.status(200).json({
        success: true,
        subscription: subscriptionData,
      });
    } catch (error) {
      console.error("Error retrieving subscription:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve subscription details",
      });
    }
  } catch (error) {
    console.error("Error in getCurrentSubscription:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Handle case where user has no valid active subscription
 * We will pull all the susbcriptions of that user and check if there is one active.
 */
async function handleNoValidSubscription(userId: number): Promise<any> {
  console.log(`🔍 Handling no valid subscription for user ${userId}`);

  // Get user from database
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  if (!user.stripeCustomerId) {
    console.warn(
      `📋 User ${userId} has no Stripe customer ID, creating default subscription`,
    );
    // Ensure user has a Stripe customer ID
    const customerId = await ensureUserHasStripeCustomer(user);
    const subscriptionData = await createDefaultSubscription(user, customerId);

    console.log(
      `✅ Created default subscription ${subscriptionData.id} for user ${userId}`,
    );
    return subscriptionData;
  }

  // Use payment service handler to retrieve all active subscriptions for the customer
  console.warn(
    `🔍 Checking all subscriptions for customer ${user.stripeCustomerId}`,
  );

  try {
    // Get all subscriptions for this customer from Stripe
    const stripe = (await import("stripe")).default;
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const subscriptions = await stripeInstance.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data;
    console.warn(
      `📊 Found ${activeSubscriptions.length} active subscriptions for customer ${user.stripeCustomerId}`,
    );

    if (activeSubscriptions.length === 0) {
      // No active subscriptions, create a new one
      console.log(
        `📋 No active subscriptions found, creating default subscription for user ${userId}`,
      );
      const subscriptionData = await createDefaultSubscription(
        user,
        user.stripeCustomerId,
      );

      console.warn(
        `✅ Created default subscription ${subscriptionData.id} for user ${userId}`,
      );
      return subscriptionData;
    } else if (activeSubscriptions.length === 1) {
      // Exactly one active subscription, assign it to the user
      const subscription = activeSubscriptions[0];
      console.warn(
        `📌 Found single active subscription ${subscription.id}, assigning to user ${userId}`,
      );

      await storage.updateUser(userId, {
        stripeSubscriptionId: subscription.id,
      });

      // Get the subscription details using our payment service handler
      const subscriptionData = await getExistingSubscription(subscription.id);
      console.log(
        `✅ Assigned subscription ${subscription.id} to user ${userId}`,
      );
      return subscriptionData;
    } else {
      // Multiple active subscriptions, use the latest one by creation date
      const latestSubscription = activeSubscriptions.reduce(
        (latest, current) => {
          return current.created > latest.created ? current : latest;
        },
      );

      console.log(
        `📌 Found ${activeSubscriptions.length} active subscriptions, using latest: ${latestSubscription.id} (created: ${new Date(latestSubscription.created * 1000).toISOString()})`,
      );

      await storage.updateUser(userId, {
        stripeSubscriptionId: latestSubscription.id,
      });

      // Get the subscription details using our payment service handler
      const subscriptionData = await getExistingSubscription(
        latestSubscription.id,
      );
      console.log(
        `✅ Assigned latest subscription ${latestSubscription.id} to user ${userId}`,
      );
      return subscriptionData;
    }
  } catch (error) {
    console.error(
      `❌ Error checking subscriptions for customer ${user.stripeCustomerId}:`,
      error,
    );

    // Fallback: create a new subscription
    console.log(
      `📋 Fallback: Creating default subscription for user ${userId} due to error`,
    );
    const subscriptionData = await createDefaultSubscription(
      user,
      user.stripeCustomerId,
    );

    console.log(
      `✅ Created fallback subscription ${subscriptionData.id} for user ${userId}`,
    );
    return subscriptionData;
  }
}

/**
 * Generate comprehensive billing cycle word usage analytics combining Stripe subscription data with detailed usage reporting
 */
export async function getBillingCycleWordUsageAnalytics(userId: number) {
  try {
    // 1. Get user from database to get their subscription ID
    const user = await storage.getUser(userId);
    if (!user?.stripeSubscriptionId) {
      throw new Error(`User ${userId} has no Stripe subscription ID`);
    }

    // 2. Retrieve authentic subscription details from Stripe
    const subscriptionData = await getUserSubscription(
      user.stripeSubscriptionId,
    );
    console.log(
      `✅ Retrieved subscription data: ${subscriptionData.plan} (${subscriptionData.wordLimit} words)`,
    );

    // 2. Calculate subscription period with precise timing (end - 1 millisecond)
    const subscriptionStart = subscriptionData.currentPeriodStart;
    const subscriptionEndExclusive = new Date(
      subscriptionData.currentPeriodEnd.getTime() - 1,
    );

    console.log(
      `📅 Billing cycle: ${subscriptionStart.toISOString()} to ${subscriptionEndExclusive.toISOString()}`,
    );

    // 3. Generate detailed word usage report for this exact timeframe
    const usageReport = await storage.wordUsageReport(
      subscriptionStart,
      subscriptionEndExclusive,
      userId,
    );

    console.log(
      `📊 Word usage summary: ${usageReport.totalWordCount} words across ${usageReport.recordingCount} recordings`,
    );

    // 4. Calculate comprehensive analytics
    const wordLimit = subscriptionData.wordLimit;
    const usagePercentage = Math.round(
      (usageReport.totalWordCount / wordLimit) * 100,
    );
    const remainingWords = Math.max(0, wordLimit - usageReport.totalWordCount);
    const hasExceededLimit = usageReport.totalWordCount > wordLimit;

    // 5. Calculate days remaining in billing cycle
    const now = new Date();
    const msRemaining =
      subscriptionData.currentPeriodEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil(msRemaining / (1000 * 60 * 60 * 24)),
    );

    // 6. Assemble comprehensive analytics response
    const analytics = {
      // Core subscription data from Stripe
      subscription: subscriptionData,

      // Detailed usage report with recordings
      usageReport: usageReport,

      // Calculated analytics
      analytics: {
        wordLimit,
        currentUsage: usageReport.totalWordCount,
        usagePercentage,
        remainingWords,
        hasExceededLimit,
        billingCycleProgress: {
          daysRemaining,
          cycleStart: subscriptionStart,
          cycleEnd: subscriptionData.currentPeriodEnd,
        },
      },
    };
    return analytics;
  } catch (error) {
    console.error("❌ ERROR in getBillingCycleWordUsageAnalytics:", error);
    throw error;
  }
}
