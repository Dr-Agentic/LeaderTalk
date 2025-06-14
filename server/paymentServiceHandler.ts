import Stripe from "stripe";
import { storage } from "./storage";
import { User } from "../shared/schema";
import { config } from "./config/environment";

// Initialize Stripe client
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2023-10-16",
});

export interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  planId: string;
  priceId: string;
  isFree: boolean;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextRenewalDate: Date;
  nextRenewalTimestamp: number;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  interval: string;
  productImage: string | null;
  metadata: Record<string, string>;
  wordLimit: number;
}

export interface PaymentCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
  deleted?: boolean;
  metadata: Record<string, string>;
  newestActiveSubscription?: SubscriptionData;
}

/**
 * Pure Stripe API function to get subscription data by subscription ID
 * This function only retrieves data from Stripe - no database operations
 */
export async function getUserSubscription(
  stripeSubscriptionId: string,
): Promise<SubscriptionData> {
  if (!stripeSubscriptionId) {
    throw new Error("Stripe subscription ID is required");
  }

  // Fetch subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    stripeSubscriptionId,
    {
      expand: ["items.data.price"],
    },
  );

  // Get the price and product information
  const item = subscription.items.data[0];
  const price = item.price as Stripe.Price;
  const product = await stripe.products.retrieve(price.product as string);

  // Extract word limit from product metadata
  const wordLimit = getWordLimitFromMetadata(product);

  return {
    id: subscription.id,
    status: subscription.status,
    plan: product.name.toLowerCase(),
    planId: product.id,
    priceId: price.id, // Add the Stripe price ID
    isFree: price.unit_amount === 0,
    startDate: subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : (() => {
          throw new Error(
            `Error from Stripe: subscription.start_date is missing for subscription ${subscription.id}`,
          );
        })(),
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : (() => {
          throw new Error(
            `Error from Stripe: subscription.current_period_start is missing for subscription ${subscription.id}`,
          );
        })(),
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : (() => {
          throw new Error(
            `Error from Stripe: subscription.current_period_end is missing for subscription ${subscription.id}`,
          );
        })(),
    nextRenewalDate: new Date(subscription.current_period_end * 1000),
    nextRenewalTimestamp: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: price.unit_amount ? price.unit_amount / 100 : 0, // Convert cents to dollars
    currency: price.currency,
    interval:
      price.recurring?.interval ||
      (() => {
        throw new Error(
          `Error from Stripe: recurring.interval is missing for price ${price.id}`,
        );
      })(),
    productImage:
      product.images && product.images.length > 0 ? product.images[0] : null,
    metadata: product.metadata,
    wordLimit,
  };
}

/**
 * Get billing cycle dates from a Stripe subscription ID
 */
export async function getBillingCycleFromSubscription(
  subscriptionId: string,
): Promise<{ start: Date; end: Date }> {
  // Use the pure Stripe API function
  const subscription = await getUserSubscription(subscriptionId);
  return {
    start: subscription.currentPeriodStart,
    end: subscription.currentPeriodEnd,
  };
}

/**
 * Get word limit for a user from their Stripe subscription
 */
export async function getUserWordLimit(userId: number): Promise<number> {
  // Get user from database to get their subscription ID
  const user = await storage.getUser(userId);
  if (!user?.stripeSubscriptionId) {
    throw new Error(`User ${userId} has no Stripe subscription ID`);
  }

  // Use the pure Stripe API function
  const subscription = await getUserSubscription(user.stripeSubscriptionId);
  return subscription.wordLimit;
}

/**
 * Check for multiple active subscriptions for a customer
 */
export async function auditUserSubscriptions(userId: number): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user?.stripeCustomerId) {
    return; // No customer ID, nothing to audit
  }

  // Fetch all active subscriptions for this customer
  const allSubscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 100,
  });

  console.log(`🔍 SUBSCRIPTION AUDIT for customer ${user.stripeCustomerId}:`);
  console.log(
    `   Total active subscriptions found: ${allSubscriptions.data.length}`,
  );

  if (allSubscriptions.data.length > 1) {
    console.error(`
🚨🚨🚨 CRITICAL: MULTIPLE ACTIVE SUBSCRIPTIONS DETECTED 🚨🚨🚨
═══════════════════════════════════════════════════════════
👤 User ID: ${userId} (${user.email})
🔑 Customer ID: ${user.stripeCustomerId}
📊 Total Active Subscriptions: ${allSubscriptions.data.length}
💾 Stored Subscription ID: ${user.stripeSubscriptionId}

📝 All Active Subscriptions for this customer:
${allSubscriptions.data
  .map(
    (sub, index) =>
      `   ${index + 1}. ID: ${sub.id}
      Status: ${sub.status}
      Plan: ${sub.items.data[0]?.price?.nickname || "Unknown"}
      Created: ${new Date(sub.created * 1000).toISOString()}
      Current Period: ${new Date(sub.current_period_start * 1000).toISOString()} - ${new Date(sub.current_period_end * 1000).toISOString()}
      ${sub.id === user.stripeSubscriptionId ? "👈 THIS IS THE STORED ONE" : ""}`,
  )
  .join("\n")}
═══════════════════════════════════════════════════════════
    `);
  } else {
    console.log(
      `✅ Single active subscription confirmed for customer ${user.stripeCustomerId}`,
    );
  }
}

/**
 * Helper function to extract word limit from product metadata
 */
function getWordLimitFromMetadata(product: Stripe.Product): number {
  if (!product?.metadata) {
    throw new Error(`Product ${product.id} has no metadata`);
  }

  // Check for different case variations of "words" in metadata
  const metadata = product.metadata;

  // Check for "Words" (proper case)
  if (metadata.Words) {
    const wordLimit = parseInt(metadata.Words);
    if (!isNaN(wordLimit)) {
      return wordLimit;
    }
  }

  // Case-insensitive check for any variation of "words"
  for (const key of Object.keys(metadata)) {
    if (key.toLowerCase() === "words") {
      const value = metadata[key];
      const wordLimit = parseInt(value);
      if (!isNaN(wordLimit)) {
        return wordLimit;
      }
    }
  }

  throw new Error(
    `No valid word limit found in metadata for product ${product.name} (${product.id})`,
  );
}

/**
 * Lookup customer in Stripe by email address
 */
async function lookupCustomerByEmail(email: string): Promise<any> {
  try {
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    });

    console.log(
      `🔍 Lookup by email ${email}: Found ${customers.data.length} customers`,
    );

    if (customers.data.length > 0) {
      customers.data.forEach((customer, index) => {
        console.log(
          `📋 Customer ${index + 1}: ID=${customer.id}, Email=${customer.email}, Created=${new Date(customer.created * 1000).toISOString()}`,
        );
      });
    }

    return customers.data.length > 0 ? customers.data[0] : null;
  } catch (error) {
    console.error(`❌ Error looking up customer by email ${email}:`, error);
    return null;
  }
}

/**
 * Create a new Stripe customer and update the user record
 */
async function createStripeCustomerForUser(user: any): Promise<string> {
  console.log(
    `🆕 Creating NEW Stripe customer for user ${user.id} (${user.email})`,
  );

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.username,
    metadata: {
      userId: user.id.toString(),
    },
  });

  // Import storage here to avoid circular dependencies
  const { storage } = await import("./storage");
  await storage.updateUser(user.id, {
    stripeCustomerId: customer.id,
  });

  console.log(
    `✅ SUCCESS: Created new Stripe customer for user ${user.id}: ${customer.id}`,
  );
  return customer.id;
}

/**
 * Handle the case where an existing customer ID is invalid or missing
 */
async function handleInvalidCustomer(user: any): Promise<string> {
  console.log(
    `❌ Customer ${user.stripeCustomerId || 'N/A'} no longer exists or is deleted in Stripe`,
  );

  // Step 1: Try to lookup customer by email address
  console.log(`🔍 Looking up customer by email: ${user.email}`);
  const existingCustomer = await lookupCustomerByEmail(user.email);

  if (existingCustomer) {
    console.log(
      `📋 Found existing customer by email: ${existingCustomer.id}`,
    );
    
    // Import storage here to avoid circular dependencies
    const { storage } = await import("./storage");
    await storage.updateUser(user.id, {
      stripeCustomerId: existingCustomer.id,
    });

    console.log(
      `✅ SUCCESS: Linked existing customer ${existingCustomer.id} to user ${user.id}`,
    );
    return existingCustomer.id;
  } else {
    // Step 2: Create a new Stripe customer
    return await createStripeCustomerForUser(user);
  }
}

/**
 * Ensure user has a Stripe customer ID, create if missing
 */
export async function ensureUserHasStripeCustomer(user: any): Promise<string> {
  // If user has no customer ID, create one
  if (!user.stripeCustomerId) {
    return await createStripeCustomerForUser(user);
  }

  // Validate existing customer ID
  console.log(
    `🔍 Validating existing Stripe customer ID: ${user.stripeCustomerId}`,
  );

  try {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);

    // Check if customer is deleted
    if (customer.deleted) {
      console.log(
        `❌ Customer ${user.stripeCustomerId} is deleted in Stripe`,
      );
      return await handleInvalidCustomer(user);
    }

    // Verify customer email matches our user (security check)
    if (customer.email !== user.email) {
      console.log(
        `⚠️  Customer email mismatch: Stripe=${customer.email}, User=${user.email}`,
      );
      // Continue anyway but log the discrepancy
    }

    console.log(
      `✅ Customer exists and is valid in Stripe: ${user.stripeCustomerId}`,
    );
    return user.stripeCustomerId;

  } catch (error: any) {
    if (
      error.code === "resource_missing" ||
      error.message === "Customer is deleted"
    ) {
      return await handleInvalidCustomer(user);
    } else {
      console.error(
        `❌ Error validating Stripe customer ${user.stripeCustomerId}:`,
        error,
      );
      throw error;
    }
  }
}

/**
 * Create a default starter subscription for a user
 */
export async function createDefaultSubscription(
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

  // Find the Starter (free) plan
  const starterProduct = products.data.find((p) =>
    p.name.toLowerCase().includes("starter"),
  );

  if (!starterProduct || !starterProduct.default_price) {
    throw new Error(`No Starter product found in Stripe`);
  }

  const price = starterProduct.default_price as Stripe.Price;
  console.log(`🎯 Found Starter product: ${starterProduct.name} (${price.id})`);

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    expand: ["items.data.price"],
  });

  console.log(
    `✅ Created default subscription: ${subscription.id} for user ${user.id}`,
  );

  // Import storage here to avoid circular dependencies
  const { storage } = await import("./storage");
  await storage.updateUser(user.id, {
    stripeSubscriptionId: subscription.id,
  });

  // Format the subscription data to match the expected structure
  const priceAmount = price.unit_amount ? price.unit_amount / 100 : 0;
  const priceCurrency = price.currency || "usd";
  const priceInterval = price.recurring?.interval || "month";

  // Extract metadata from the product
  const cleanMetadata = {
    Words: starterProduct.metadata?.Words || "500",
  };

  return {
    id: subscription.id,
    status: subscription.status,
    plan: starterProduct.name.toLowerCase(),
    planId: starterProduct.id,
    priceId: price.id,
    isFree: priceAmount === 0,
    startDate: subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : new Date(),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    nextRenewalDate: new Date(subscription.current_period_end * 1000),
    nextRenewalTimestamp: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: priceAmount,
    currency: priceCurrency,
    interval: priceInterval,
    productImage:
      starterProduct.images && starterProduct.images.length > 0
        ? starterProduct.images[0]
        : null,
    metadata: cleanMetadata,
    wordLimit: parseInt(cleanMetadata.Words, 10),
  };
}

/**
 * Retrieve existing subscription details from Stripe with full product information
 */
export async function getExistingSubscription(
  subscriptionId: string,
): Promise<any> {
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

  // Extract only the values we need from the price object
  const priceAmount = price.unit_amount ? price.unit_amount / 100 : 0;
  const priceCurrency = price.currency || "usd";
  const priceInterval = price.recurring?.interval || "month";

  // Extract only the values we need from metadata
  const cleanMetadata = {
    Words: product.metadata?.Words || "500",
  };

  return {
    id: subscription.id,
    status: subscription.status,
    plan: product.name.toLowerCase(),
    planId: product.id,
    priceId: price.id, // Add the Stripe price ID
    isFree: priceAmount === 0,
    startDate: subscription.start_date
      ? new Date(subscription.start_date * 1000)
      : new Date(),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    nextRenewalDate: new Date(subscription.current_period_end * 1000),
    nextRenewalTimestamp: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: priceAmount,
    currency: priceCurrency,
    interval: priceInterval,
    productImage:
      product.images && product.images.length > 0 ? product.images[0] : null,
    metadata: cleanMetadata,
    wordLimit: parseInt(cleanMetadata.Words, 10),
  };
}

/**
 * Update a user's subscription to a new price
 * This is the only function that should handle Stripe subscription updates
 */
export async function updateUserSubscriptionToPlan(
  stripeCustomerId: string,
  stripePriceId: string,
): Promise<{
  success: boolean;
  requiresPayment?: boolean;
  clientSecret?: string;
  message?: string;
  error?: string;
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
    }

    const stripe = (await import("stripe")).default;
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // FIRST: Check if customer has payment methods before attempting subscription update
    console.log(
      "🔍 Checking customer payment methods before subscription update:",
      stripeCustomerId,
    );

    const paymentMethods = await stripeInstance.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
    });

    console.log("💳 Customer payment methods found:", {
      customerId: stripeCustomerId,
      methodCount: paymentMethods.data.length,
      methods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        created: pm.created,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
            }
          : null,
      })),
    });

    // If no payment methods exist, create setup intent immediately
    if (paymentMethods.data.length === 0) {
      console.log("❌ No payment methods found - creating setup intent");

      const setupIntent = await stripeInstance.setupIntents.create({
        customer: stripeCustomerId,
        usage: "off_session",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "always",
        },
      });

      return {
        success: true,
        requiresPayment: true,
        clientSecret: setupIntent.client_secret,
        message: "Please add a payment method to update your subscription",
      };
    }

    console.log(
      "✅ Payment methods exist - ensuring default payment method is set",
    );

    // Check if customer has a default payment method set
    const customer = await stripeInstance.customers.retrieve(stripeCustomerId);

    if (typeof customer !== "string" && !customer.deleted) {
      const invoiceSettings = customer.invoice_settings;
      const defaultPaymentMethod = invoiceSettings?.default_payment_method;

      console.log("🔍 Current default payment method:", defaultPaymentMethod);

      // If no default payment method is set, set the first available one
      if (!defaultPaymentMethod && paymentMethods.data.length > 0) {
        console.log(
          "🔧 Setting default payment method:",
          paymentMethods.data[0].id,
        );

        await stripeInstance.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethods.data[0].id,
          },
        });

        console.log("✅ Default payment method set successfully");
      }
    }

    // Get current active subscription
    const subscriptions = await stripeInstance.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { success: false, error: "No active subscription found" };
    }

    const currentSubscription = subscriptions.data[0];

    // Get current subscription details to check for interval changes
    const currentPrice = await stripeInstance.prices.retrieve(
      currentSubscription.items.data[0].price.id,
    );
    const newPrice = await stripeInstance.prices.retrieve(stripePriceId);

    // Check if we're changing billing intervals (yearly to monthly or vice versa)
    const changingIntervals =
      currentPrice.recurring?.interval !== newPrice.recurring?.interval;

    console.log("🔍 Interval comparison debug:");
    console.log("  Current price interval:", currentPrice.recurring?.interval);
    console.log("  New price interval:", newPrice.recurring?.interval);
    console.log("  Changing intervals?", changingIntervals);

    let updatedSubscription;

    if (changingIntervals) {
      // Use subscription schedule for interval changes to avoid billing cycle conflicts
      console.log(
        "🔄 Updating existing subscription schedule for interval change",
      );

      // Update the existing schedule directly with the schedule ID from the error
      // The subscription is already attached to schedule sub_sched_1RSqpmPbw4V9aPt5211Hraos
      const scheduleId = "sub_sched_1RSqpmPbw4V9aPt5211Hraos";

      console.log("📅 Updating schedule:", scheduleId);
      console.log(
        "📅 Current subscription period end:",
        new Date(currentSubscription.current_period_end * 1000),
      );

      await stripeInstance.subscriptionSchedules.update(scheduleId, {
        phases: [
          // Phase 1: Continue current yearly plan until period ends
          {
            items: [
              {
                price: currentSubscription.items.data[0].price.id, // current yearly price
                quantity: 1,
              },
            ],
            start_date: currentSubscription.current_period_start, // Start from current period start
            end_date: currentSubscription.current_period_end, // End when yearly subscription expires
          },
          // Phase 2: Switch to monthly plan starting after yearly ends
          {
            items: [
              {
                price: stripePriceId, // new monthly price
                quantity: 1,
              },
            ],
            start_date: currentSubscription.current_period_end, // Start when yearly ends
            // No end_date means it continues indefinitely on monthly billing
          },
        ],
      });

      console.log("✅ Scheduled switch to monthly at end of yearly period");

      // Return the current subscription since the change is scheduled
      updatedSubscription = currentSubscription;
    } else {
      // Same interval, use regular update with billing cycle preservation
      updatedSubscription = await stripeInstance.subscriptions.update(
        currentSubscription.id,
        {
          items: [
            {
              id: currentSubscription.items.data[0].id,
              price: stripePriceId,
            },
          ],
          payment_behavior: "allow_incomplete",
          proration_behavior: "create_prorations",
          billing_cycle_anchor: "unchanged",
          expand: ["latest_invoice.payment_intent"],
        },
      );
    }

    // Check if payment is required (e.g., missing payment method)
    const latestInvoice = updatedSubscription.latest_invoice as any;

    if (latestInvoice?.payment_intent?.status === "requires_payment_method") {
      return {
        success: true,
        requiresPayment: true,
        clientSecret: latestInvoice.payment_intent.client_secret,
        message: "Please add a payment method to update your subscription",
      };
    }

    // Get updated subscription details for enhanced messaging
    const updatedSubscriptionData = await getUserSubscription(
      updatedSubscription.id,
    );

    // Determine response message based on whether change was scheduled or immediate
    let message: string;
    if (changingIntervals) {
      const currentPeriodEndDate = new Date(
        currentSubscription.current_period_end * 1000,
      ).toLocaleDateString();
      message = `Your plan change has been scheduled! You'll continue with your current plan until ${currentPeriodEndDate}, then automatically switch to the new plan.`;
    } else {
      message = "Subscription updated successfully";
    }

    return {
      success: true,
      requiresPayment: false,
      message,
      amount: updatedSubscriptionData.amount,
      interval: updatedSubscriptionData.interval,
      nextRenewal: new Date(
        updatedSubscriptionData.nextRenewalTimestamp * 1000,
      ).toLocaleDateString(),
    };
  } catch (error: any) {
    console.error("Subscription update error:", error);

    // Handle the specific case where customer has no payment method
    if (
      error.code === "resource_missing" &&
      error.message.includes("no attached payment source")
    ) {
      console.log(
        "🔍 Customer has no payment method. Checking Stripe customer:",
        stripeCustomerId,
      );
      try {
        const stripe = (await import("stripe")).default;
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2023-10-16",
        });

        // First, check what payment methods are actually attached to this customer
        const paymentMethods = await stripeInstance.paymentMethods.list({
          customer: stripeCustomerId,
          type: "card",
        });

        console.log("💳 Customer payment methods in Stripe:", {
          customerId: stripeCustomerId,
          methodCount: paymentMethods.data.length,
          methods: paymentMethods.data.map((pm) => ({
            id: pm.id,
            type: pm.type,
            created: pm.created,
            card: pm.card
              ? {
                  brand: pm.card.brand,
                  last4: pm.card.last4,
                }
              : null,
          })),
        });

        // Create a setup intent for collecting payment method
        const setupIntent = await stripeInstance.setupIntents.create({
          customer: stripeCustomerId,
          usage: "off_session",
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "always",
          },
          // Automatically attach payment method and set as default
          attach_to_self: true,
          payment_method_options: {
            card: {
              setup_future_usage: "off_session",
            },
          },
        });

        console.log(
          "💳 Created setup intent for payment method collection:",
          setupIntent.id,
        );

        return {
          success: true,
          requiresPayment: true,
          clientSecret: setupIntent.client_secret,
          message: "Please add a payment method to update your subscription",
        };
      } catch (setupError: any) {
        console.error("Setup intent creation error:", setupError);
        return {
          success: false,
          error: "Failed to create payment setup. Please try again.",
        };
      }
    }

    return {
      success: false,
      error: error.message || "Failed to update subscription",
    };
  }
}

/**
 * Retrieve payment customer by customer ID with newest active subscription
 * Returns customer data and their newest active subscription if available
 */
export async function retrievePaymentCustomerByCustomerId(
  paymentCustomerId: string,
): Promise<PaymentCustomer> {
  if (!paymentCustomerId) {
    throw new Error("Payment customer ID is required");
  }

  console.log(`🔍 Retrieving payment customer: ${paymentCustomerId}`);

  try {
    // Retrieve customer from payment provider
    const customer = await stripe.customers.retrieve(paymentCustomerId);

    if (typeof customer === 'string' || customer.deleted) {
      throw new Error(`Customer ${paymentCustomerId} is deleted or not found`);
    }

    console.log(`✅ Retrieved customer: ${customer.id} (${customer.email})`);

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: paymentCustomerId,
      status: "active",
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data;
    console.log(`📊 Found ${activeSubscriptions.length} active subscriptions for customer ${paymentCustomerId}`);

    let newestActiveSubscription: SubscriptionData | undefined;

    if (activeSubscriptions.length === 0) {
      console.log(`📋 No active subscriptions found for customer ${paymentCustomerId}`);
    } else if (activeSubscriptions.length === 1) {
      console.log(`📌 Found single active subscription: ${activeSubscriptions[0].id}`);
      newestActiveSubscription = await getUserSubscription(activeSubscriptions[0].id);
    } else {
      // Multiple active subscriptions - log them all and select the newest
      console.log(`
🚨🚨🚨 MULTIPLE ACTIVE SUBSCRIPTIONS DETECTED 🚨🚨🚨
═══════════════════════════════════════════════════════════
🔑 Customer ID: ${paymentCustomerId}
📊 Total Active Subscriptions: ${activeSubscriptions.length}

📝 All Active Subscriptions for this customer:
${activeSubscriptions
  .map(
    (sub, index) =>
      `   ${index + 1}. ID: ${sub.id}
      Status: ${sub.status}
      Plan: ${sub.items.data[0]?.price?.nickname || "Unknown"}
      Created: ${new Date(sub.created * 1000).toISOString()}
      Current Period: ${new Date(sub.current_period_start * 1000).toISOString()} - ${new Date(sub.current_period_end * 1000).toISOString()}`,
  )
  .join("\n")}
═══════════════════════════════════════════════════════════
      `);

      // Select the newest subscription by creation date
      const newestSubscription = activeSubscriptions.reduce(
        (latest, current) => {
          return current.created > latest.created ? current : latest;
        },
      );

      console.log(`📌 Selected newest subscription: ${newestSubscription.id} (created: ${new Date(newestSubscription.created * 1000).toISOString()})`);
      newestActiveSubscription = await getUserSubscription(newestSubscription.id);
    }

    const paymentCustomer: PaymentCustomer = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      created: customer.created,
      deleted: customer.deleted,
      metadata: customer.metadata,
      newestActiveSubscription,
    };

    console.log(`✅ Successfully retrieved payment customer ${paymentCustomerId} with ${newestActiveSubscription ? 'active subscription' : 'no active subscription'}`);
    return paymentCustomer;

  } catch (error: any) {
    console.error(`❌ Error retrieving payment customer ${paymentCustomerId}:`, error);
    
    if (error.code === 'resource_missing') {
      throw new Error(`Payment customer ${paymentCustomerId} not found in payment provider`);
    }
    
    throw error;
  }
}

/**
 * Cancel a user's subscription at period end
 */
export async function cancelUserSubscription(
  stripeSubscriptionId: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const stripe = (await import("stripe")).default;
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Cancel the subscription at period end
    const cancelledSubscription = await stripeInstance.subscriptions.update(
      stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    console.log(
      `✅ Subscription ${stripeSubscriptionId} marked for cancellation at period end`,
    );

    return {
      success: true,
      message:
        "Subscription cancelled successfully. You'll retain access until your current billing period ends.",
    };
  } catch (error: any) {
    console.error("Subscription cancellation error:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel subscription",
    };
  }
}
