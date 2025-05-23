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
 * Centralized function to get subscription data for a user
 * This is the SINGLE SOURCE OF TRUTH for all subscription operations
 */
export async function getUserSubscription(userId: number): Promise<SubscriptionData> {
  // Get user from database
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Check if user has Stripe subscription
  if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
    throw new Error(`User ${userId} has no active Stripe subscription`);
  }

  // Fetch subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
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
 * Get billing cycle dates for a user from their Stripe subscription
 */
export async function getUserBillingCycle(userId: number): Promise<{ start: Date; end: Date }> {
  const subscription = await getUserSubscription(userId);
  return {
    start: subscription.currentPeriodStart,
    end: subscription.currentPeriodEnd
  };
}

/**
 * Get word limit for a user from their Stripe subscription
 */
export async function getUserWordLimit(userId: number): Promise<number> {
  const subscription = await getUserSubscription(userId);
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