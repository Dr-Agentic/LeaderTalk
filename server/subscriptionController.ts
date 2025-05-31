import { Request, Response } from "express";
import { storage } from "./storage";
import { config } from "./config/environment";
import {
  getUserSubscription,
  getBillingCycleFromSubscription,
  getUserWordLimit,
  ensureUserHasStripeCustomer,
  createDefaultSubscription,
  getExistingSubscription,
  updateUserSubscriptionToPlan,
  cancelUserSubscription,
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
    const stripeInstance = new stripe(config.stripe.secretKey, {
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
    const stripe = (await import("stripe")).default;
    const stripeInstance = new stripe(config.stripe.secretKey, {
      apiVersion: "2024-04-10",
    });
    
    // Get all active products from Stripe
    const products = await stripeInstance.products.list({ 
      limit: 100,
      active: true
    });
    
    console.log(`📦 Found ${products.data.length} active products in Stripe`);
    console.log(`📦 Products:`, products.data.map(p => ({ 
      id: p.id,
      name: p.name, 
      metadata: p.metadata,
      images: p.images?.length || 0 
    })));
    
    // Get all active prices
    const prices = await stripeInstance.prices.list({ 
      limit: 100,
      active: true
    });
    
    const billingProducts = [];
    
    for (const product of products.data) {
      if (!product.active) continue;
      
      // Get monthly and yearly prices for this product
      const productPrices = prices.data.filter(price => price.product === product.id);
      const monthlyPrice = productPrices.find(p => p.recurring?.interval === 'month');
      const yearlyPrice = productPrices.find(p => p.recurring?.interval === 'year');
      
      if (!monthlyPrice) {
        console.warn(`⚠️ No monthly price found for product ${product.name}, skipping`);
        continue;
      }
      
      const monthlyAmount = monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0;
      const yearlyAmount = yearlyPrice ? (yearlyPrice.unit_amount ? yearlyPrice.unit_amount / 100 : 0) : monthlyAmount * 12;
      const yearlySavings = yearlyPrice ? Math.round(((monthlyAmount * 12 - yearlyAmount) / (monthlyAmount * 12)) * 100) : 0;
      
      // Extract word limit from metadata - REQUIRED
      const wordLimit = product.metadata?.wordLimit ? parseInt(product.metadata.wordLimit) : 
                       product.metadata?.Words ? parseInt(product.metadata.Words) : null;
      if (!wordLimit) {
        console.warn(`⚠️ No wordLimit or Words in metadata for product ${product.name}, skipping`);
        continue;
      }
      
      // Clean up product name - remove underscores and format properly
      const cleanName = product.name.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      const planCode = product.metadata?.planCode || product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Create monthly product option
      billingProducts.push({
        id: `${product.id}_monthly`,
        stripeProductId: product.id,
        code: `${planCode}_monthly`,
        name: `${cleanName} Monthly`,
        description: `${wordLimit.toLocaleString()} words per month`,
        productIcon: product.images?.[0] || null,
        pricing: {
          amount: monthlyAmount,
          formattedPrice: `$${monthlyAmount.toFixed(2)}/month`,
          interval: 'monthly',
          stripePriceId: monthlyPrice.id
        },
        features: {
          wordLimit,
          maxRecordingLength: parseInt(product.metadata?.maxRecordingLength || '300'),
          leaderLibraryAccess: product.metadata?.leaderLibraryAccess !== 'false',
          advancedAnalytics: product.metadata?.advancedAnalytics === 'true',
          prioritySupport: product.metadata?.prioritySupport === 'true'
        },
        isPopular: product.metadata?.isPopular === 'true' && !yearlyPrice, // Only if no yearly option
        isDefault: product.metadata?.isDefault === 'true' && !yearlyPrice,
        billingType: 'monthly'
      });

      // Create yearly product option if yearly pricing exists
      if (yearlyPrice) {
        billingProducts.push({
          id: `${product.id}_yearly`,
          stripeProductId: product.id,
          code: `${planCode}_yearly`,
          name: `${cleanName} Yearly`,
          description: `${wordLimit.toLocaleString()} words per month (billed annually)`,
          productIcon: product.images?.[0] || null,
          pricing: {
            amount: yearlyAmount,
            formattedPrice: `$${yearlyAmount.toFixed(2)}/year`,
            formattedSavings: yearlySavings > 0 ? `Save ${yearlySavings}%` : null,
            interval: 'yearly',
            stripePriceId: yearlyPrice.id
          },
          features: {
            wordLimit,
            maxRecordingLength: parseInt(product.metadata?.maxRecordingLength || '300'),
            leaderLibraryAccess: product.metadata?.leaderLibraryAccess !== 'false',
            advancedAnalytics: product.metadata?.advancedAnalytics === 'true',
            prioritySupport: product.metadata?.prioritySupport === 'true'
          },
          isPopular: product.metadata?.isPopular === 'true', // Yearly is popular if available
          isDefault: product.metadata?.isDefault === 'true',
          billingType: 'yearly'
        });
      }
    }
    
    if (billingProducts.length === 0) {
      throw new Error('No valid products found in Stripe. Products must have wordLimit in metadata and monthly pricing.');
    }
    
    // Sort by word limit ascending
    billingProducts.sort((a, b) => a.features.wordLimit - b.features.wordLimit);
    
    console.log(`✅ Returning ${billingProducts.length} valid products from our payment provider`);
    res.json(billingProducts);
    
  } catch (error) {
    console.error('❌ Failed to get products from our payment provider:', error);
    res.status(500).json({ 
      error: 'Failed to load subscription plans from payment service',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
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
        priceId: subscriptionData.priceId, // Add the Stripe price ID
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

    // 2. Calculate word usage period - monthly cycles regardless of payment frequency
    let usagePeriodStart: Date;
    let usagePeriodEnd: Date;
    
    if (subscriptionData.interval === 'year') {
      // For annual plans, calculate current monthly word usage period
      const subscriptionStart = subscriptionData.currentPeriodStart;
      const now = new Date();
      const billingDay = subscriptionStart.getDate(); // 26th in your case
      
      // Find current monthly cycle based on billing day
      let currentMonthStart: Date;
      if (now.getDate() >= billingDay) {
        // We're in the current month's cycle
        currentMonthStart = new Date(now.getFullYear(), now.getMonth(), billingDay);
      } else {
        // We're in the previous month's cycle
        currentMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDay);
      }
      
      // Monthly cycle ends the day before next billing day
      const nextMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, billingDay);
      const currentMonthEnd = new Date(nextMonthStart.getTime() - 1);
      
      usagePeriodStart = currentMonthStart;
      usagePeriodEnd = currentMonthEnd;
    } else {
      // For monthly plans, use Stripe billing cycle
      usagePeriodStart = subscriptionData.currentPeriodStart;
      usagePeriodEnd = new Date(subscriptionData.currentPeriodEnd.getTime() - 1);
    }

    console.log(
      `📅 Word usage period: ${usagePeriodStart.toISOString()} to ${usagePeriodEnd.toISOString()}`,
    );

    // 3. Generate detailed word usage report for this exact timeframe
    const usageReport = await storage.wordUsageReport(
      usagePeriodStart,
      usagePeriodEnd,
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

    // 5. Calculate days remaining in word usage cycle
    const now = new Date();
    const msRemaining = usagePeriodEnd.getTime() - now.getTime();
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
          cycleStart: usagePeriodStart,
          cycleEnd: usagePeriodEnd,
        },
      },
    };
    return analytics;
  } catch (error) {
    console.error("❌ ERROR in getBillingCycleWordUsageAnalytics:", error);
    throw error;
  }
}

/**
 * Get historical billing cycle word usage for N monthly cycles based on subscription anniversary date
 */
export async function getHistoricalBillingCycleUsage(userId: number, monthlyCycles: number = 6) {
  try {
    console.log(`📊 Generating ${monthlyCycles} historical monthly cycles for user ${userId}`);
    
    const user = await storage.getUser(userId);
    if (!user?.stripeSubscriptionId) {
      throw new Error(`User ${userId} has no Stripe subscription ID`);
    }

    const subscriptionData = await getUserSubscription(user.stripeSubscriptionId);
    console.log(`✅ Retrieved subscription for history: ${subscriptionData.plan} (${subscriptionData.interval})`);

    const historicalCycles = [];
    const subscriptionStart = subscriptionData.currentPeriodStart;
    const billingDay = subscriptionStart.getDate(); // Anniversary day (26th in your case)
    
    // Generate cycles based on subscription anniversary date
    for (let i = 0; i < monthlyCycles; i++) {
      let cycleStart: Date;
      let cycleEnd: Date;

      if (subscriptionData.interval === 'year') {
        // For annual plans, create monthly cycles from subscription anniversary date
        const now = new Date();
        
        // Calculate the current monthly cycle
        let currentMonthStart: Date;
        if (now.getDate() >= billingDay) {
          currentMonthStart = new Date(now.getFullYear(), now.getMonth(), billingDay);
        } else {
          currentMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDay);
        }
        
        // Go back i months from current cycle
        cycleStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - i, billingDay);
        cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, billingDay - 1, 23, 59, 59, 999);
        
      } else {
        // For monthly plans, use actual Stripe billing cycles
        cycleStart = new Date(subscriptionStart.getTime() - (i * 30 * 24 * 60 * 60 * 1000));
        cycleEnd = new Date(cycleStart.getTime() + (30 * 24 * 60 * 60 * 1000) - 1);
      }

      // Get usage data for this cycle
      const usageReport = await storage.wordUsageReport(cycleStart, cycleEnd, userId);
      
      const isCurrent = i === 0; // First cycle is current
      const cycleLabel = isCurrent ? 'Current' : 
        `${cycleStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -\n${cycleEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      const cycleData = {
        cycleLabel,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        wordsUsed: usageReport.totalWordCount,
        wordLimit: subscriptionData.wordLimit,
        usagePercentage: Math.round((usageReport.totalWordCount / subscriptionData.wordLimit) * 100),
        isCurrent,
        recordingCount: usageReport.recordingCount,
        recordings: usageReport.recordings
      };

      historicalCycles.push(cycleData);
      console.log(`📊 Cycle ${i + 1}: ${cycleLabel} (${cycleStart.toLocaleDateString()} - ${cycleEnd.toLocaleDateString()}) - ${usageReport.totalWordCount} words`);
    }

    // Reverse to show oldest to newest
    historicalCycles.reverse();

    return {
      userId,
      subscription: subscriptionData,
      monthlyCycles,
      historicalCycles,
      generatedAt: new Date()
    };

  } catch (error) {
    console.error("❌ ERROR in getHistoricalBillingCycleUsage:", error);
    throw error;
  }
}



/**
 * Update a user's subscription to a new plan
 * Maintains proper architecture by using paymentServiceHandler for all Stripe operations
 */
export async function updateUserSubscription(userId: number, stripePriceId: string): Promise<{
  success: boolean;
  requiresPayment?: boolean;
  clientSecret?: string;
  message?: string;
  error?: string;
}> {
  try {
    const user = await storage.getUser(userId);
    if (!user?.stripeCustomerId) {
      return { success: false, error: "No Stripe customer found" };
    }

    // Use paymentServiceHandler to update subscription - it handles all Stripe logic
    const result = await updateUserSubscriptionToPlan(user.stripeCustomerId!, stripePriceId);
    return result;

  } catch (error: any) {
    console.error('Subscription update error:', error);
    return { 
      success: false,
      error: error.message || "Failed to update subscription" 
    };
  }
}

export async function cancelSubscription(req: Request, res: Response) {
  try {
    const { userId, user } = await validateUserAccess(req);

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: "No active subscription found to cancel"
      });
    }

    const result = await cancelUserSubscription(user.stripeSubscriptionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel subscription"
    });
  }
}
