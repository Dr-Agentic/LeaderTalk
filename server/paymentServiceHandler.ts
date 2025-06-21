import Stripe from "stripe";
import { storage } from "./storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
  paymentCustomerId: string;
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
 * Initialize payment setup for a new user
 * Creates Stripe customer and default subscription, returns PaymentCustomer object
 */
export async function initializePaymentForUser(
  user: any,
): Promise<PaymentCustomer> {
  console.log(
    `🚀 Initializing payment setup for user ${user.id} (${user.email})`,
  );

  // Step 1: Ensure user has a Stripe customer ID
  const stripeCustomerId = await createStripeCustomerForUser(user);

  // Step 2: Create default subscription
  const subscriptionData = await createDefaultSubscription(
    user,
    stripeCustomerId,
  );

  // Step 3: Retrieve full customer data with subscription
  const paymentCustomer =
    await retrievePaymentCustomerByCustomerId(stripeCustomerId);

  console.log(
    `✅ Payment initialization complete for user ${user.id} - Customer: ${stripeCustomerId}, Subscription: ${subscriptionData.id}`,
  );

  return paymentCustomer;
}

/**
 * Pure Stripe API function to get subscription data by subscription ID
 * This function only retrieves data from Stripe - no database operations
 */
export async function retrievePaymentSubscriptionById(
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
  const wordLimit = _getWordLimitFromMetadata(product);

  return {
    id: subscription.id,
    status: subscription.status,
    plan: product.name.toLowerCase(),
    planId: product.id,
    priceId: price.id,
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
    metadata: product.metadata,
    wordLimit,
    paymentCustomerId: subscription.customer as string,
  };
}

/**
 * Get billing cycle dates from a Stripe subscription ID
 */
export async function getBillingCycleFromSubscription(
  subscriptionId: string,
): Promise<{ start: Date; end: Date }> {
  try {
    const subscriptionData = await retrievePaymentSubscriptionById(
      subscriptionId,
    );

    return {
      start: subscriptionData.currentPeriodStart,
      end: subscriptionData.currentPeriodEnd,
    };
  } catch (error: any) {
    console.error("Error fetching billing cycle:", error);
    throw new Error("Failed to fetch billing cycle information");
  }
}

/**
 * Get word limit for a user from their Stripe subscription
 */
export async function getUserWordLimit(userId: number): Promise<number> {
  try {
    const user = await storage.getUser(userId);
    if (!user?.stripeCustomerId) {
      console.log("User has no stripe customer ID, using default limit");
      return 500; // Default free tier limit
    }

    // Get the subscription data which includes word limit from product metadata
    const subscriptionData = await retrievePaymentSubscriptionById(
      user.stripeSubscriptionId!,
    );

    console.log("✅ Retrieved subscription data:", subscriptionData.plan, `(${subscriptionData.wordLimit} words)`);
    return subscriptionData.wordLimit;
  } catch (error: any) {
    console.error("Error getting user word limit:", error);
    return 500; // Fallback to free tier limit
  }
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

    // Select the newest subscription by creation date
    const newestSubscription = allSubscriptions.data.reduce(
      (latest, current) => {
        return current.created > latest.created ? current : latest;
      },
    );

    console.log(
      `📌 Selected newest subscription: ${newestSubscription.id} (created: ${new Date(newestSubscription.created * 1000).toISOString()})`,
    );
  }
}

/**
 * Helper function to extract word limit from product metadata
 */
function _getWordLimitFromMetadata(product: Stripe.Product): number {
  const wordsMetadata = product.metadata?.Words;
  if (!wordsMetadata) {
    console.warn(`No Words metadata found for product ${product.id}, defaulting to 500`);
    return 500;
  }
  return parseInt(wordsMetadata, 10) || 500;
}

/**
 * Lookup customer by email address in Stripe
 * Returns a PaymentCustomer object if found, otherwise null
 */
export async function lookupCustomerByEmail(email: string): Promise<any> {
  try {
    const stripeCustomer = await _lookupCustomerByEmail(email);
    
    if (!stripeCustomer) {
      return null;
    }

    // Get the newest active subscription if available
    let newestActiveSubscription;
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      status: "active",
      limit: 100,
    });

    if (activeSubscriptions.data.length === 1) {
      console.log(`✅ Found 1 active subscription for customer ${stripeCustomer.id}`);
      newestActiveSubscription = await retrievePaymentSubscriptionById(
        activeSubscriptions.data[0].id,
      );
    } else if (activeSubscriptions.data.length > 1) {
      console.error(`
🚨🚨🚨 CRITICAL: MULTIPLE ACTIVE SUBSCRIPTIONS DETECTED 🚨🚨🚨
═══════════════════════════════════════════════════════════
👤 Customer Email: ${email}
🔑 Customer ID: ${stripeCustomer.id}
📊 Total Active Subscriptions: ${activeSubscriptions.data.length}

📝 All Active Subscriptions for this customer:
${activeSubscriptions.data
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
      const newestSubscription = activeSubscriptions.data.reduce(
        (latest, current) => {
          return current.created > latest.created ? current : latest;
        },
      );

      console.log(
        `📌 Selected newest subscription: ${newestSubscription.id} (created: ${new Date(newestSubscription.created * 1000).toISOString()})`,
      );
      newestActiveSubscription = await retrievePaymentSubscriptionById(
        newestSubscription.id,
      );
    }

    const paymentCustomer: PaymentCustomer = {
      id: stripeCustomer.id,
      email: stripeCustomer.email,
      name: stripeCustomer.name,
      created: stripeCustomer.created,
      deleted: stripeCustomer.deleted,
      metadata: stripeCustomer.metadata,
      newestActiveSubscription,
    };

    console.log(
      `✅ Successfully retrieved payment customer ${stripeCustomer.id} with ${newestActiveSubscription ? "active subscription" : "no active subscription"}`,
    );
    return paymentCustomer;
  } catch (error: any) {
    console.error(
      `❌ Error retrieving payment customer by email ${email}:`,
      error,
    );

    if (error.code === "resource_missing") {
      throw new Error(
        `Payment customer with email ${email} not found in payment provider`,
      );
    }

    throw error;
  }
}

/**
 * Lookup customer in Stripe by email address
 */
async function _lookupCustomerByEmail(email: string): Promise<any> {
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

    if (customers.data.length > 0) {
      return customers.data[0];
    }
    return null;
  } catch (error) {
    console.error(`❌ Error looking up customer by email ${email}:`, error);
    return null;
  }
}

/**
 * Create a new Stripe customer and update the user record
 * Return the paymendCustomerId newly created.
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
    `❌ Customer ${user.stripeCustomerId || "N/A"} no longer exists or is deleted in Stripe`,
  );

  // Step 1: Try to lookup customer by email address
  console.log(`🔍 Looking up customer by email: ${user.email}`);
  const existingCustomer = await _lookupCustomerByEmail(user.email);

  if (existingCustomer) {
    console.log(`📋 Found existing customer by email: ${existingCustomer.id}`);

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
      console.log(`❌ Customer ${user.stripeCustomerId} is deleted in Stripe`);
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
    paymentCustomerId: customerId,
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
  amount?: number;
  interval?: string;
  nextRenewal?: string;
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
    }

    console.log("🔍 Checking customer payment methods:", stripeCustomerId);

    const maxRetries = 3;
    let paymentMethodsFound = false;
    
    for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card",
      });
      
      console.log(`💳 Payment method check attempt ${retryCount + 1}/${maxRetries + 1}:`, {
        customerId: stripeCustomerId,
        methodCount: paymentMethods.data.length,
      });
      
      if (paymentMethods.data.length > 0) {
        console.log("✅ Payment methods found");
        paymentMethodsFound = true;
        break;
      }
      
      if (retryCount < maxRetries) {
        const delayMs = (retryCount + 1) * 1000;
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    if (!paymentMethodsFound) {
      console.log("❌ Creating setup intent for payment method collection");
      const setupIntent = await stripe.setupIntents.create({
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
        clientSecret: setupIntent.client_secret || undefined,
        message: "Please add a payment method to update your subscription",
      };
    }

    // Get active subscriptions to update
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found for customer");
    }

    const subscription = subscriptions.data[0];
    
    // Update the subscription to the new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: stripePriceId,
          },
        ],
        proration_behavior: "create_prorations",
        expand: ["latest_invoice.payment_intent"],
      },
    );

    console.log("✅ Subscription updated successfully:", updatedSubscription.id);

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
    const updatedSubscriptionData = await retrievePaymentSubscriptionById(
      updatedSubscription.id,
    );

    return {
      success: true,
      requiresPayment: false,
      message: "Subscription updated successfully",
      amount: updatedSubscriptionData.amount,
      interval: updatedSubscriptionData.interval,
      nextRenewal: new Date(
        updatedSubscriptionData.nextRenewalTimestamp * 1000,
      ).toLocaleDateString(),
    };
  } catch (error: any) {
    console.error("❌ Subscription update failed:", error);

    // Handle the specific case where customer has no payment method
    if (
      error.code === "resource_missing" &&
      error.message.includes("no attached payment source")
    ) {
      console.log(
        "🔍 Customer has no payment method. Creating setup intent:",
        stripeCustomerId,
      );
      try {
        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          usage: "off_session",
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "always",
          },
        });

        console.log(
          "💳 Created setup intent for payment method collection:",
          setupIntent.id,
        );

        return {
          success: true,
          requiresPayment: true,
          clientSecret: setupIntent.client_secret || undefined,
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

    if (typeof customer === "string" || customer.deleted) {
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
    console.log(
      `📊 Found ${activeSubscriptions.length} active subscriptions for customer ${paymentCustomerId}`,
    );

    let newestActiveSubscription: SubscriptionData | undefined;

    if (activeSubscriptions.length === 0) {
      console.log(
        `📋 No active subscriptions found for customer ${paymentCustomerId}`,
      );
    } else if (activeSubscriptions.length === 1) {
      console.log(
        `📌 Found single active subscription: ${activeSubscriptions[0].id}`,
      );
      newestActiveSubscription = await retrievePaymentSubscriptionById(
        activeSubscriptions[0].id,
      );
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

      console.log(
        `📌 Selected newest subscription: ${newestSubscription.id} (created: ${new Date(newestSubscription.created * 1000).toISOString()})`,
      );
      newestActiveSubscription = await retrievePaymentSubscriptionById(
        newestSubscription.id,
      );
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

    console.log(
      `✅ Successfully retrieved payment customer ${paymentCustomerId} with ${newestActiveSubscription ? "active subscription" : "no active subscription"}`,
    );
    return paymentCustomer;
  } catch (error: any) {
    console.error(
      `❌ Error retrieving payment customer ${paymentCustomerId}:`,
      error,
    );

    if (error.code === "resource_missing") {
      throw new Error(
        `Payment customer ${paymentCustomerId} not found in payment provider`,
      );
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
    // Cancel the subscription at period end
    const cancelledSubscription = await stripe.subscriptions.update(
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