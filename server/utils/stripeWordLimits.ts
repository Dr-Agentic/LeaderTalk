import Stripe from "stripe";
import { storage } from "../storage";

// Make sure we have a Stripe secret key configured
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY environment variable");
}

// Initialize Stripe client
const stripe = new Stripe(secretKey || "", {
  apiVersion: "2023-10-16", // Use a stable API version
});

/**
 * Helper function to extract word limit from product metadata
 * Handles different case variations (words, Words, WORDS)
 * Returns 0 if no valid metadata is found
 */
export function getWordLimitFromMetadata(product: Stripe.Product): number {
  if (!product.metadata) {
    return 0;
  }

  // Check for "Words" field in various case forms
  const wordsKey = Object.keys(product.metadata).find(
    (key) => key.toLowerCase() === "words"
  );

  if (wordsKey && product.metadata[wordsKey]) {
    const wordLimit = parseInt(product.metadata[wordsKey]);
    if (!isNaN(wordLimit) && wordLimit > 0) {
      return wordLimit;
    }
  }

  return 0;
}

/**
 * Get word limit for a given product ID
 * This function centralizes all word limit retrievals from Stripe
 */
export async function getProductWordLimit(productId: string): Promise<number> {
  try {
    if (!secretKey) {
      throw new Error("Missing Stripe API key");
    }

    // Fetch the product from Stripe
    const product = await stripe.products.retrieve(productId);
    
    // Extract the word limit from metadata
    const wordLimit = getWordLimitFromMetadata(product);
    
    return wordLimit;
  } catch (error) {
    console.error(`Error retrieving word limit for product ${productId}:`, error);
    throw error; // Re-throw to allow calling code to handle the error
  }
}

/**
 * Get word limit for a user's current subscription
 * This function gets the user's subscription ID, fetches the subscription from Stripe,
 * finds the associated product, and returns its word limit
 */
export async function getUserSubscriptionWordLimit(userId: number): Promise<number> {
  try {
    // Get the user from storage
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // If the user doesn't have a Stripe subscription ID, return 0
    if (!user.stripeSubscriptionId) {
      throw new Error(`User ${userId} has no Stripe subscription ID`);
    }

    // Fetch the subscription from Stripe with minimal expansion to avoid errors
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
      expand: ['items.data.price']
    });

    // Get the price ID from the subscription
    if (!subscription.items.data.length) {
      throw new Error(`Subscription ${user.stripeSubscriptionId} has no items`);
    }

    const item = subscription.items.data[0];
    const price = item.price as Stripe.Price;
    const productId = price.product as string;

    // Get the word limit for this product
    return await getProductWordLimit(productId);
  } catch (error) {
    console.error(`Error retrieving word limit for user ${userId}:`, error);
    throw error; // Re-throw to allow calling code to handle the error
  }
}