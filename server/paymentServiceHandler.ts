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

export interface PaymentMethodData {
  id: string;
  type: string;
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  link?: {
    email: string;
  };
  created: number;
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

// Helper functions for subscription updates
async function _validateCustomerAndPaymentMethods(stripeCustomerId: string) {
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (typeof customer === "string" || customer.deleted) {
    throw new Error(`Customer ${stripeCustomerId} not found or deleted`);
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
  });

  console.log(`💳 Payment methods found: ${paymentMethods.data.length}`, {
    types: paymentMethods.data.map(pm => pm.type),
  });

  if (paymentMethods.data.length === 0) {
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
    });

    return {
      needsPaymentMethod: true,
      clientSecret: setupIntent.client_secret || undefined,
    };
  }

  // Set default payment method if not set
  if (!customer.invoice_settings?.default_payment_method) {
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethods.data[0].id },
    });
  }

  return { needsPaymentMethod: false };
}

async function _updateSubscriptionPrice(stripeCustomerId: string, stripePriceId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 10, // Get more to handle multiple subscriptions properly
  });

  if (subscriptions.data.length === 0) {
    throw new Error("No active subscription found");
  }

  // If multiple subscriptions exist, cancel all but the most recent one
  if (subscriptions.data.length > 1) {
    console.log(`⚠️ Found ${subscriptions.data.length} active subscriptions, consolidating...`);
    
    // Sort by creation date (most recent first)
    subscriptions.data.sort((a, b) => b.created - a.created);
    const keepSubscription = subscriptions.data[0];
    
    // Cancel older subscriptions
    for (let i = 1; i < subscriptions.data.length; i++) {
      const oldSub = subscriptions.data[i];
      console.log(`🗑️ Canceling duplicate subscription: ${oldSub.id}`);
      await stripe.subscriptions.cancel(oldSub.id);
    }
    
    console.log(`✅ Keeping subscription: ${keepSubscription.id}`);
  }

  const subscription = subscriptions.data[0];
  
  return await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscription.items.data[0].id, price: stripePriceId }],
    payment_behavior: "allow_incomplete",
    proration_behavior: "create_prorations",
    expand: ["latest_invoice.payment_intent"],
  });
}

/**
 * Update a user's subscription to a new price
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
    console.log("🔄 Updating subscription for customer:", stripeCustomerId);

    // Check if customer has payment methods
    const validation = await _validateCustomerAndPaymentMethods(stripeCustomerId);
    if (validation.needsPaymentMethod) {
      return {
        success: true,
        requiresPayment: true,
        clientSecret: validation.clientSecret,
        message: "Please add a payment method to update your subscription",
      };
    }

    // Update the subscription
    const updatedSubscription = await _updateSubscriptionPrice(stripeCustomerId, stripePriceId);
    const latestInvoice = updatedSubscription.latest_invoice as any;

    // Handle payment requirements
    if (latestInvoice?.payment_intent?.status === "requires_payment_method") {
      return {
        success: true,
        requiresPayment: true,
        clientSecret: latestInvoice.payment_intent.client_secret,
        message: "Please complete payment to finalize subscription update",
      };
    }

    console.log("✅ Subscription updated successfully");
    return {
      success: true,
      requiresPayment: false,
      message: "Subscription updated successfully",
    };

  } catch (error: any) {
    console.error("❌ Subscription update failed:", error);
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
 * Retrieve all payment methods for a customer
 */
export async function getCustomerPaymentMethods(
  stripeCustomerId: string,
): Promise<PaymentMethodData[]> {
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (typeof customer === "string" || customer.deleted) {
    throw new Error(`Customer ${stripeCustomerId} not found or deleted`);
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    limit: 100,
  });

  const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

  return paymentMethods.data.map((pm) => ({
    id: pm.id,
    type: pm.type,
    isDefault: pm.id === defaultPaymentMethodId,
    card: pm.card ? {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    } : undefined,
    link: pm.link ? {
      email: pm.link.email || '',
    } : undefined,
    created: pm.created,
  }));
}

/**
 * Set a payment method as the default for a customer
 */
export async function setDefaultPaymentMethod(
  stripeCustomerId: string,
  paymentMethodId: string,
): Promise<void> {
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}

/**
 * Create a setup intent for adding new payment methods
 */
export async function createPaymentMethodSetupIntent(
  stripeCustomerId: string,
): Promise<{ clientSecret: string }> {
  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    usage: "off_session",
    automatic_payment_methods: { enabled: true },
  });

  if (!setupIntent.client_secret) {
    throw new Error("Failed to create setup intent");
  }

  return { clientSecret: setupIntent.client_secret };
}

/**
 * Preview upcoming invoice for subscription change (Stripe's prorated calculation)
 */
export async function getSubscriptionChangePreview(
  stripeCustomerId: string,
  newPriceId: string,
): Promise<{
  changeType: 'upgrade' | 'downgrade' | 'same';
  currentPlan: string;
  newPlan: string;
  immediateCharge: number;
  proratedCredit: number;
  nextBillingAmount: number;
  currency: string;
  description: string;
}> {
  // Get current subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    throw new Error("No active subscription found");
  }

  const currentSubscription = subscriptions.data[0];
  const currentPrice = currentSubscription.items.data[0].price;
  const newPrice = await stripe.prices.retrieve(newPriceId);
  
  // Get upcoming invoice preview from Stripe
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: stripeCustomerId,
    subscription: currentSubscription.id,
    subscription_items: [{
      id: currentSubscription.items.data[0].id,
      price: newPriceId,
    }],
    subscription_proration_behavior: 'create_prorations',
  });

  const currentAmount = currentPrice.unit_amount || 0;
  const newAmount = newPrice.unit_amount || 0;
  
  const changeType = newAmount > currentAmount ? 'upgrade' : 
                    newAmount < currentAmount ? 'downgrade' : 'same';

  // Calculate immediate charge and prorated amounts
  let immediateCharge = 0;
  let proratedCredit = 0;
  
  upcomingInvoice.lines.data.forEach(line => {
    if (line.proration) {
      if (line.amount < 0) {
        proratedCredit += Math.abs(line.amount);
      } else {
        immediateCharge += line.amount;
      }
    }
  });

  const description = changeType === 'upgrade' 
    ? `Upgrade to ${newPrice.nickname}. You'll be charged the prorated difference immediately.`
    : changeType === 'downgrade'
    ? `Downgrade to ${newPrice.nickname}. You'll receive a prorated credit applied to your next bill.`
    : `No change in price. Your plan will be updated immediately.`;

  return {
    changeType,
    currentPlan: currentPrice.nickname || 'Current Plan',
    newPlan: newPrice.nickname || 'New Plan',
    immediateCharge: immediateCharge / 100, // Convert from cents
    proratedCredit: proratedCredit / 100, // Convert from cents
    nextBillingAmount: newAmount / 100, // Convert from cents
    currency: upcomingInvoice.currency,
    description,
  };
}

/**
 * Get subscription change impact details
 */
export async function getSubscriptionChangeImpact(
  stripeSubscriptionId: string,
  newPriceId: string,
): Promise<{
  changeType: 'upgrade' | 'downgrade' | 'same';
  currentPlan: string;
  newPlan: string;
  proratedCredit: number;
  immediateCharge: number;
  nextBillingAmount: number;
  currency: string;
  warningMessage?: string;
}> {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const currentPrice = subscription.items.data[0].price;
  const newPrice = await stripe.prices.retrieve(newPriceId);
  
  const currentAmount = currentPrice.unit_amount || 0;
  const newAmount = newPrice.unit_amount || 0;
  
  const changeType = newAmount > currentAmount ? 'upgrade' : 
                    newAmount < currentAmount ? 'downgrade' : 'same';
  
  const creditInfo = await calculateProratedCredit(stripeSubscriptionId);
  
  let immediateCharge = 0;
  let warningMessage: string | undefined;
  
  if (changeType === 'upgrade') {
    // For upgrades, charge the prorated difference immediately
    const proratedNewAmount = Math.round((newAmount * creditInfo.remainingDays) / creditInfo.totalDays);
    immediateCharge = (proratedNewAmount - (creditInfo.proratedCredit * 100)) / 100;
  } else if (changeType === 'downgrade') {
    // For downgrades, warn about lost value
    warningMessage = `You'll lose $${creditInfo.proratedCredit.toFixed(2)} from your current subscription. This change will take effect at your next billing cycle.`;
  }
  
  return {
    changeType,
    currentPlan: currentPrice.nickname || 'Current Plan',
    newPlan: newPrice.nickname || 'New Plan',
    proratedCredit: creditInfo.proratedCredit,
    immediateCharge: Math.max(0, immediateCharge),
    nextBillingAmount: newAmount / 100,
    currency: creditInfo.currency,
    warningMessage,
  };
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