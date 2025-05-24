import Stripe from "stripe";
import { storage } from "./storage";
import { User } from "../shared/schema";

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  planId: string;
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

/**
 * Pure Stripe API function to get subscription data by subscription ID
 * This function only retrieves data from Stripe - no database operations
 */
export async function getUserSubscription(stripeSubscriptionId: string): Promise<SubscriptionData> {
  if (!stripeSubscriptionId) {
    throw new Error('Stripe subscription ID is required');
  }

  // Fetch subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price']
  });

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
    isFree: price.unit_amount === 0,
    startDate: subscription.start_date ? new Date(subscription.start_date * 1000) : 
      (() => { throw new Error(`Error from Stripe: subscription.start_date is missing for subscription ${subscription.id}`) })(),
    currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) :
      (() => { throw new Error(`Error from Stripe: subscription.current_period_start is missing for subscription ${subscription.id}`) })(),
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) :
      (() => { throw new Error(`Error from Stripe: subscription.current_period_end is missing for subscription ${subscription.id}`) })(),
    nextRenewalDate: new Date(subscription.current_period_end * 1000),
    nextRenewalTimestamp: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amount: price.unit_amount || 0,
    currency: price.currency,
    interval: price.recurring?.interval || 
      (() => { throw new Error(`Error from Stripe: recurring.interval is missing for price ${price.id}`) })(),
    productImage: product.images && product.images.length > 0 ? product.images[0] : null,
    metadata: product.metadata,
    wordLimit
  };
}

/**
 * Get billing cycle dates from a Stripe subscription ID
 */
export async function getBillingCycleFromSubscription(subscriptionId: string): Promise<{ start: Date; end: Date }> {
  // Use the pure Stripe API function
  const subscription = await getUserSubscription(subscriptionId);
  return {
    start: subscription.currentPeriodStart,
    end: subscription.currentPeriodEnd
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
    status: 'active',
    limit: 100
  });

  console.log(`🔍 SUBSCRIPTION AUDIT for customer ${user.stripeCustomerId}:`);
  console.log(`   Total active subscriptions found: ${allSubscriptions.data.length}`);

  if (allSubscriptions.data.length > 1) {
    console.error(`
🚨🚨🚨 CRITICAL: MULTIPLE ACTIVE SUBSCRIPTIONS DETECTED 🚨🚨🚨
═══════════════════════════════════════════════════════════
👤 User ID: ${userId} (${user.email})
🔑 Customer ID: ${user.stripeCustomerId}
📊 Total Active Subscriptions: ${allSubscriptions.data.length}
💾 Stored Subscription ID: ${user.stripeSubscriptionId}

📝 All Active Subscriptions for this customer:
${allSubscriptions.data.map((sub, index) => 
  `   ${index + 1}. ID: ${sub.id}
      Status: ${sub.status}
      Plan: ${sub.items.data[0]?.price?.nickname || 'Unknown'}
      Created: ${new Date(sub.created * 1000).toISOString()}
      Current Period: ${new Date(sub.current_period_start * 1000).toISOString()} - ${new Date(sub.current_period_end * 1000).toISOString()}
      ${sub.id === user.stripeSubscriptionId ? '👈 THIS IS THE STORED ONE' : ''}`
).join('\n')}
═══════════════════════════════════════════════════════════
    `);
  } else {
    console.log(`✅ Single active subscription confirmed for customer ${user.stripeCustomerId}`);
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
    if (key.toLowerCase() === 'words') {
      const value = metadata[key];
      const wordLimit = parseInt(value);
      if (!isNaN(wordLimit)) {
        return wordLimit;
      }
    }
  }

  throw new Error(`No valid word limit found in metadata for product ${product.name} (${product.id})`);
}

/**
 * Ensure user has a Stripe customer ID, create if missing
 */
export async function ensureUserHasStripeCustomer(user: any): Promise<string> {
  if (user.stripeCustomerId) {
    console.log(
      `♻️  Using existing Stripe customer ID: ${user.stripeCustomerId}`,
    );
    return user.stripeCustomerId;
  }

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

  return subscription;
}

/**
 * Retrieve existing subscription details from Stripe with full product information
 */
export async function getExistingSubscription(subscriptionId: string): Promise<any> {
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