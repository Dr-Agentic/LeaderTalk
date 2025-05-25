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
        `✅ Retrieved subscription data: ${JSON.stringify(subscriptionData, null, 2)}`,
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

  // First, ensure the customer ID is valid before checking subscriptions
  console.log(`🔍 Validating customer before checking subscriptions...`);
  
  try {
    const validCustomerId = await ensureUserHasStripeCustomer(user);
    
    if (validCustomerId !== user.stripeCustomerId) {
      console.log(`📝 Customer ID updated from ${user.stripeCustomerId} to ${validCustomerId}`);
      // Customer was recreated, so they won't have existing subscriptions
      console.log(`📋 Customer was recreated, creating default subscription`);
      const subscriptionData = await createDefaultSubscription(user, validCustomerId);
      console.log(`✅ Created default subscription ${subscriptionData.id} for user ${userId}`);
      return subscriptionData;
    }

    // Get all subscriptions for this customer from Stripe
    const stripe = (await import("stripe")).default;
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    const subscriptions = await stripeInstance.subscriptions.list({
      customer: validCustomerId,
      status: "active",
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data;
    console.log(
      `📊 Found ${activeSubscriptions.length} active subscriptions for customer ${validCustomerId}`,
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
  } catch (error: any) {
    console.error(`❌ Error checking subscriptions:`, error);
    
    // If the error is about the customer not existing, try to fix it
    if (error.code === 'resource_missing' && error.param === 'customer') {
      console.log(`❌ Customer validation failed during subscription check, recreating customer`);
      
      try {
        // Clear the invalid customer ID and recreate
        await storage.updateUser(userId, { stripeCustomerId: null });
        const updatedUser = await storage.getUser(userId);
        
        const newCustomerId = await ensureUserHasStripeCustomer(updatedUser);
        const subscriptionData = await createDefaultSubscription(updatedUser, newCustomerId);
        
        console.log(`✅ Recovered: Created new customer and subscription ${subscriptionData.id} for user ${userId}`);
        return subscriptionData;
      } catch (recoveryError) {
        console.error(`❌ Recovery failed:`, recoveryError);
        throw new Error(`Unable to create valid subscription for user ${userId}`);
      }
    }
    
    // For other errors, try fallback with current customer ID
    console.log(`📋 Fallback: Creating default subscription for user ${userId} due to error`);
    
    try {
      const subscriptionData = await createDefaultSubscription(user, user.stripeCustomerId);
      console.log(`✅ Created fallback subscription ${subscriptionData.id} for user ${userId}`);
      return subscriptionData;
    } catch (fallbackError) {
      console.error(`❌ Fallback also failed:`, fallbackError);
      throw new Error(`Unable to create subscription for user ${userId}: ${error.message}`);
    }
  }
}

/**
 * Get all available billing products with server-side formatting
 */
export async function getBillingProducts(req: Request, res: Response) {
  try {
    const plans = await storage.getSubscriptionPlans();
    
    // Transform to clean billing format with server-side formatting
    const billingProducts = await Promise.all(plans.map(async plan => {
      const monthlyPrice = parseFloat(plan.monthlyPriceUsd);
      const yearlyPrice = parseFloat(plan.yearlyPriceUsd);
      const yearlySavings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);
      
      // Get product icon from payment service using plan code
      let productIcon = null;
      try {
        const stripe = (await import("stripe")).default;
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2023-10-16",
        });
        
        // Search for products by name/metadata to match our plan codes
        const products = await stripeInstance.products.list({ limit: 100 });
        const matchingProduct = products.data.find(product => 
          product.name.toLowerCase().includes(plan.name.toLowerCase()) ||
          product.metadata?.planCode === plan.planCode
        );
        
        if (matchingProduct && matchingProduct.images && matchingProduct.images.length > 0) {
          productIcon = matchingProduct.images[0];
        }
      } catch (error) {
        console.warn(`Could not retrieve product icon for plan ${plan.planCode}:`, error);
      }
      
      return {
        id: plan.id.toString(),
        code: plan.planCode,
        name: plan.name,
        description: `${plan.monthlyWordLimit.toLocaleString()} words per month`,
        productIcon,
        pricing: {
          monthly: {
            amount: monthlyPrice,
            formattedPrice: `$${monthlyPrice.toFixed(2)}/month`,
            interval: 'monthly'
          },
          yearly: {
            amount: yearlyPrice,
            formattedPrice: `$${yearlyPrice.toFixed(2)}/year`,
            formattedSavings: yearlySavings > 0 ? `Save ${yearlySavings}%` : null,
            interval: 'yearly'
          }
        },
        features: {
          wordLimit: plan.monthlyWordLimit,
          formattedWordLimit: `${plan.monthlyWordLimit.toLocaleString()} words/month`,
          benefits: plan.features || []
        },
        isDefault: plan.isDefault || false,
        isPopular: plan.planCode === 'pro' // Mark Pro as popular
      };
    }));
    
    res.json(billingProducts);
  } catch (error) {
    console.error("Error fetching billing products:", error);
    res.status(500).json({ error: "Failed to fetch billing products" });
  }
}

/**
 * Get current user subscription with enhanced server-side formatting
 */
export async function getCurrentSubscriptionFormatted(req: Request, res: Response) {
  try {
    // Reuse existing logic from getCurrentSubscription
    const { userId, user } = await validateUserAccess(req);

    if (!user.stripeSubscriptionId) {
      return res.json({
        success: true,
        hasSubscription: false,
        formattedMessage: "No active subscription found"
      });
    }

    // Get subscription details using existing function
    const subscriptionData = await getUserSubscription(user.stripeSubscriptionId);
    
    // Format dates helper
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Get current word usage for this billing cycle using existing analytics
    const analytics = await getBillingCycleWordUsageAnalytics(userId);
    const currentUsage = analytics.analytics.currentUsage;

    const formattedSubscription = {
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        plan: subscriptionData.plan,
        planId: subscriptionData.planId,
        isFree: subscriptionData.isFree,
        
        // Formatted amounts
        formattedAmount: `$${subscriptionData.amount.toFixed(2)}`,
        formattedInterval: `/${subscriptionData.interval}`,
        
        // Formatted dates
        startDate: subscriptionData.startDate,
        formattedStartDate: formatDate(subscriptionData.startDate),
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        formattedCurrentPeriod: `${formatDate(subscriptionData.currentPeriodStart)} - ${formatDate(subscriptionData.currentPeriodEnd)}`,
        nextRenewalDate: subscriptionData.nextRenewalDate,
        formattedNextRenewal: formatDate(subscriptionData.nextRenewalDate),
        
        // Word usage with formatting
        wordLimit: subscriptionData.wordLimit,
        currentUsage,
        formattedUsage: `${currentUsage.toLocaleString()} of ${subscriptionData.wordLimit.toLocaleString()} words`,
        usagePercentage: analytics.analytics.usagePercentage,
        
        // Status formatting
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        formattedStatus: subscriptionData.status.charAt(0).toUpperCase() + subscriptionData.status.slice(1),
        statusColor: getStatusColor(subscriptionData.status),
        
        // Billing cycle info
        daysRemaining: analytics.analytics.billingCycleProgress.daysRemaining,
        formattedDaysRemaining: `${analytics.analytics.billingCycleProgress.daysRemaining} days remaining`
      }
    };

    res.json(formattedSubscription);
  } catch (error) {
    console.error("Error fetching formatted subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription details" });
  }
}

/**
 * Helper function to get status color for UI
 */
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active': return 'green';
    case 'trialing': return 'blue';
    case 'past_due': return 'yellow';
    case 'canceled': return 'red';
    case 'unpaid': return 'red';
    default: return 'gray';
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
