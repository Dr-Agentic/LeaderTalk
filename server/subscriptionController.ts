import { Request, Response } from "express";
import { storage } from "./storage";
import Stripe from "stripe";
import {
  getUserSubscription,
  getUserBillingCycle,
  getUserWordLimit,
  ensureUserHasStripeCustomer,
  createDefaultSubscription,
} from "./paymentServiceHandler";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

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
 * Create a default starter subscription for a user
 */
async function createDefaultSubscription(
  user: any,
  customerId: string,
): Promise<any> {
  console.log(
    `🔄 Creating default Starter subscription for user ${user.id}...`,
  );

  // Fetch all products to find the Starter plan
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  let productName = "ERROR: No Starter plan found";
  // Find the Starter (free) plan
  const starterProduct = products.data.find(
    (p) =>
      p.name.toLowerCase().includes("starter") ||
      (p.default_price && (p.default_price as Stripe.Price).unit_amount === 0),
  );

  if (!starterProduct || !starterProduct.default_price) {
    throw new Error("No Starter plan found in Stripe");
  }

  const priceId = (starterProduct.default_price as Stripe.Price).id;

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: {
      userId: user.id.toString(),
    },
  });

  // Update user with subscription ID
  await storage.updateUser(user.id, {
    stripeSubscriptionId: subscription.id,
    subscriptionPlan: starterProduct.name,
  });

  console.log(`🎉 SUBSCRIPTION INITIALIZATION COMPLETE!`);
  console.log(
    `✅ Created default Starter subscription for user ${user.id}: ${subscription.id}`,
  );

  return {
    id: subscription.id,
    status: subscription.status,
    plan: "starter",
    planId: starterProduct.id,
    isFree: true,
    startDate: subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : new Date(),
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : new Date(),
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : new Date(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: 0,
    currency: (starterProduct.default_price as Stripe.Price).currency,
    interval:
      (starterProduct.default_price as Stripe.Price).recurring?.interval ||
      "month",
    productImage:
      starterProduct.images && starterProduct.images.length > 0
        ? starterProduct.images[0]
        : null,
  };
}

/**
 * Retrieve existing subscription details from Stripe
 */
async function getExistingSubscription(subscriptionId: string): Promise<any> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  const item = subscription.items.data[0];
  const price = item.price as Stripe.Price;
  const product = await stripe.products.retrieve(price.product as string);

  console.log("Stripe product details:");
  console.log("- Name:", product.name);
  console.log("- ID:", product.id);
  console.log("- Metadata:", product.metadata);

  return {
    id: subscription.id,
    status: subscription.status,
    plan: product.name.toLowerCase(),
    planId: product.id,
    isFree: price.unit_amount === 0,
    startDate: subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : new Date(),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    nextRenewalDate: new Date(subscription.current_period_end * 1000),
    nextRenewalTimestamp: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: price.unit_amount ? price.unit_amount / 100 : 0,
    currency: price.currency,
    interval: price.recurring?.interval || "month",
    productImage:
      product.images && product.images.length > 0 ? product.images[0] : null,
    metadata: product.metadata || {},
    wordLimit: parseInt(
      product.metadata?.Words || "ERROR: no word limit metadata",
      10,
    ),
  };
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
        const customerId = await ensureStripeCustomer(user);
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
      const subscriptionData = await getExistingSubscription(
        user.stripeSubscriptionId,
      );

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
          cycleEnd: subscriptionData.currentPeriodEnd
        },
      },
    };
    return analytics;
  } catch (error) {
    console.error("❌ ERROR in getBillingCycleWordUsageAnalytics:", error);
    throw error;
  }
}
