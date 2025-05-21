import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

/**
 * Helper function to extract word limit from a product metadata
 * Handles different case variations (words, Words, WORDS) and fallback values
 */
function getWordLimitFromMetadata(product: Stripe.Product): number {
  if (!product || !product.metadata) {
    console.log("No product metadata found, using fallback value");
    return getDefaultWordLimit(product.name);
  }
  
  // Log full product details for debugging
  console.log("Checking product metadata for word limit:");
  console.log("- Product name:", product.name);
  console.log("- Product metadata:", product.metadata);
  
  // Check for different case variations of "words" in metadata
  const metadata = product.metadata;
  
  // Check for "Words" (proper case as shown in metadata)
  if (metadata.Words) {
    const wordLimit = parseInt(metadata.Words);
    if (!isNaN(wordLimit)) {
      console.log(`Found word limit in metadata 'Words':`, wordLimit);
      return wordLimit;
    }
  }
  
  // Case-insensitive check for any variation of "words" in metadata keys
  for (const key of Object.keys(metadata)) {
    if (key.toLowerCase() === 'words') {
      const value = metadata[key];
      console.log(`Found word limit in metadata key '${key}':`, value);
      
      const wordLimit = parseInt(value);
      if (!isNaN(wordLimit)) {
        return wordLimit;
      }
    }
  }
  
  // If we get here, no valid word limit was found in metadata
  console.log("No valid word limit found in metadata, using fallback value");
  return getDefaultWordLimit(product.name);
}

/**
 * Get default word limit based on plan name
 */
function getDefaultWordLimit(productName: string): number {
  const planName = (productName || '').toLowerCase();
  
  if (planName.includes('starter')) {
    return 5000;
  } else if (planName.includes('pro')) {
    return 15000;
  } else if (planName.includes('executive')) {
    return 50000;
  }
  
  // Default fallback
  console.log(`Unknown plan name "${productName}", using default word limit of 5000`);
  return 5000;
}

// Validate that Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing STRIPE_SECRET_KEY environment variable");
}

// Initialize Stripe client
// Make sure we're using the secret key for server-side API calls
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not defined! Stripe functionality will be limited.");
}

// Initialize Stripe with the secret key
// Ensure the secret key is properly trimmed to avoid invalid characters
const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : '';
const stripe = new Stripe(secretKey, {
  apiVersion: "2023-10-16", // Standard stable version
});

// Get active subscription details for the current user
export async function getCurrentSubscription(req: Request, res: Response) {
  // Ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Get the logged-in user ID from the session
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }
    
    // Retrieve the user from the database
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Check if the user has a Stripe subscription ID
    if (!user.stripeSubscriptionId) {
      console.log(`User ${userId} has no Stripe subscription, creating a default Starter subscription`);
      
      try {
        // Create or get the customer in Stripe
        let customerId = user.stripeCustomerId;
        
        // If user doesn't have a Stripe customer ID, create one
        if (!customerId) {
          // Create a new Stripe customer
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.username,
            metadata: {
              userId: user.id.toString(),
            },
          });
          
          customerId = customer.id;
          
          // Update the user with their new Stripe customer ID
          await storage.updateUser(user.id, {
            stripeCustomerId: customerId
          });
          
          console.log(`Created new Stripe customer for user ${userId}: ${customerId}`);
        }
        
        // Fetch all products to find the Starter plan
        const products = await stripe.products.list({
          active: true,
          expand: ['data.default_price']
        });
        
        // Find the Starter (free) plan
        const starterProduct = products.data.find(p => 
          p.name.toLowerCase().includes('starter') || 
          (p.default_price && (p.default_price as Stripe.Price).unit_amount === 0)
        );
        
        if (!starterProduct || !starterProduct.default_price) {
          console.log("No Starter plan found in Stripe, returning temporary free plan data");
          // If we can't find a starter product, return temporary free plan data
          return res.status(200).json({
            success: true,
            subscription: {
              plan: "starter",
              status: "active",
              isFree: true,
              currentPeriodStart: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false
            }
          });
        }
        
        const priceId = (starterProduct.default_price as Stripe.Price).id;
        
        // Create a subscription for the user with the Starter plan
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: {
            userId: user.id.toString()
          }
        });
        
        // Update the user with their new subscription ID
        await storage.updateUser(user.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionPlan: "starter"
        });
        
        console.log(`Created default Starter subscription for user ${userId}: ${subscription.id}`);
        
        // Format and return the new subscription
        return res.status(200).json({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            plan: "starter",
            planId: starterProduct.id,
            isFree: true,
            // Original subscription start date
            startDate: subscription.start_date ? new Date(subscription.start_date * 1000) : new Date(),
            // Current billing period
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            amount: 0,
            currency: (starterProduct.default_price as Stripe.Price).currency,
            interval: (starterProduct.default_price as Stripe.Price).recurring?.interval || 'month',
            productImage: starterProduct.images && starterProduct.images.length > 0 ? starterProduct.images[0] : null
          }
        });
        
      } catch (error) {
        console.error("Error creating default subscription:", error);
        // Fall back to returning basic subscription data if subscription creation fails
        return res.status(200).json({
          success: true,
          subscription: {
            plan: "starter",
            status: "active",
            isFree: true,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false
          }
        });
      }
    }
    
    // User has a subscription ID, so fetch the details from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['items.data.price.product']
      });
      
      // Get the product details from the subscription
      const item = subscription.items.data[0];
      const price = item.price;
      const product = price.product as Stripe.Product;
      
      // Debug product information to see what metadata is available
      console.log("Stripe product details:");
      console.log("- Name:", product.name);
      console.log("- ID:", product.id);
      console.log("- Metadata:", product.metadata);
      
      // Format the response with detailed subscription timing information
      // Ensure we set Content-Type header explicitly to avoid any potential rendering issues
      res.setHeader('Content-Type', 'application/json');
      console.log("Subscription start date from Stripe:", subscription.start_date ? new Date(subscription.start_date * 1000) : "not found");
      
      return res.status(200).json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan: product.name.toLowerCase(),
          planId: product.id,
          isFree: price.unit_amount === 0,
          // Original start date of subscription
          startDate: subscription.start_date ? new Date(subscription.start_date * 1000) : new Date(),
          // Current billing period
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          // Next renewal information
          nextRenewalDate: new Date(subscription.current_period_end * 1000),
          nextRenewalTimestamp: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          // Pricing details
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          productImage: product.images && product.images.length > 0 ? product.images[0] : null,
          // Include product metadata
          metadata: product.metadata || {},
          // Extract word limit directly from the Words metadata field
          wordLimit: product.metadata?.Words ? parseInt(product.metadata.Words) : null
        }
      });
    } catch (subError) {
      console.error(`Error retrieving subscription ${user.stripeSubscriptionId}:`, subError);
      
      // The subscription ID in our database is invalid or the subscription was deleted in Stripe
      // Clear the invalid subscription ID and recursively call this function to create a new one
      await storage.updateUser(user.id, {
        stripeSubscriptionId: null
      });
      
      // Call this function again to create a new subscription
      return getCurrentSubscription(req, res);
    }
    
  } catch (error) {
    console.error("Error in subscription handling:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve or create subscription details"
    });
  }
}

// Fetch products from Stripe API for display in the UI
export async function getStripeProducts(req: Request, res: Response) {
  try {
    // Verify we have a valid secret key
    if (!secretKey || secretKey.trim() === '') {
      console.log("Missing Stripe secret key");
      return res.status(500).json({
        success: false,
        error: "Stripe API key is not configured. Please contact the administrator."
      });
    }
    
    console.log("Fetching products from Stripe API...");
    
    // Log the first few characters of the key for debugging (never log the full key)
    console.log(`Using Stripe key starting with: ${secretKey.substring(0, 4)}...`);
    
    // Fetch active products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'] // Include the default price
    });

    console.log(`Retrieved ${products.data.length} products from Stripe`);
    
    // For each product, fetch all available prices
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        return {
          ...product,
          prices: prices.data,
        };
      })
    );

    // Filter out products without prices and sort by price (ascending)
    const validProducts = productsWithPrices
      .filter(product => product.prices.length > 0)
      .sort((a, b) => {
        const aPrice = a.prices[0]?.unit_amount || 0;
        const bPrice = b.prices[0]?.unit_amount || 0;
        return aPrice - bPrice;
      });

    console.log(`Returning ${validProducts.length} valid products with prices from Stripe`);
    
    return res.json({
      success: true,
      products: validProducts,
      source: 'stripe'
    });
  } catch (error: any) {
    console.error("Error fetching Stripe products:", error);
    
    // Provide detailed error for better troubleshooting
    let errorMessage = "Failed to fetch subscription products from Stripe";
    if (error.type || error.code) {
      errorMessage += `: ${error.message || "Unknown error"}`;
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}

// Create a subscription directly with Stripe Products/Prices API
export async function createStripeSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ 
        success: false, 
        error: "Price ID is required" 
      });
    }
    
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Check if the user already has a Stripe customer ID
    let customerId = user.stripeCustomerId;
    let customerNeedsCreation = !customerId;
    
    // If user has a customerId, verify it exists in Stripe
    if (customerId) {
      try {
        // Verify the customer exists before attempting to create a subscription
        const customerCheck = await stripe.customers.retrieve(customerId);
        console.log(`Verified existing customer: ${customerCheck.id}`);
      } catch (error) {
        console.error("Customer verification failed, will create new customer:", error.message);
        // Clear the invalid customer ID and create a new one
        customerNeedsCreation = true;
      }
    }
    
    // Create a new customer if needed
    if (customerNeedsCreation) {
      try {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id.toString(),
          },
        });
        
        customerId = customer.id;
        console.log(`Created new Stripe customer: ${customerId}`);
        
        // Update the user with the new Stripe customer ID
        await storage.updateUser(userId, {
          stripeCustomerId: customerId,
        });
      } catch (error) {
        console.error("Error creating new customer:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to create customer in Stripe. Please try again later."
        });
      }
    }

    // Fetch the price from Stripe to get product details
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

    console.log(`Creating subscription with Stripe customer ID: ${customerId}`);
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId.toString(),
        priceId: priceId,
        productId: (price.product as Stripe.Product).id,
        productName: (price.product as Stripe.Product).name,
      },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Return client secret to the frontend
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      productDetails: {
        name: (price.product as Stripe.Product).name,
        amount: price.unit_amount ? price.unit_amount / 100 : 0,
        currency: price.currency.toUpperCase(),
        interval: price.recurring?.interval || 'month',
      },
    });
  } catch (error) {
    console.error("Error creating Stripe subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create subscription",
    });
  }
}

// Create a subscription payment intent
export async function createSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    const { planCode } = req.body;
    
    if (!planCode) {
      return res.status(400).json({ 
        success: false, 
        error: "Plan code is required" 
      });
    }
    
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Get the subscription plan
    const plan = await storage.getSubscriptionPlanByCode(planCode);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: "Subscription plan not found" 
      });
    }

    // Convert price to cents (Stripe uses smallest currency unit)
    const priceCents = Math.round(parseFloat(plan.monthlyPriceUsd) * 100);
    
    // Check if the user already has a Stripe customer ID
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
        },
      });
      
      customerId = customer.id;
      
      // Update the user with the new Stripe customer ID
      await storage.updateUser(userId, {
        stripeCustomerId: customerId,
      });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceCents,
      currency: "usd",
      customer: customerId,
      metadata: {
        userId: userId.toString(),
        planCode,
        planName: plan.name,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Return client secret to the frontend
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      planDetails: {
        name: plan.name,
        amount: priceCents / 100,
        currency: "USD",
        description: `${plan.name} Plan - ${plan.monthlyWordLimit} words per month`,
      },
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create subscription payment",
    });
  }
}

// Verify payment status
export async function verifyPaymentStatus(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        error: "Payment intent ID is required" 
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === "succeeded") {
      // Payment was successful
      
      // Get user and plan from metadata
      const userId = parseInt(paymentIntent.metadata.userId || "0");
      const planCode = paymentIntent.metadata.planCode;
      
      if (userId && planCode) {
        // Update the user's subscription plan
        await storage.updateUser(userId, {
          subscriptionPlan: planCode,
          lastPaymentDate: new Date(),
        });
      }
      
      return res.json({
        success: true,
        status: paymentIntent.status,
        message: "Payment processed successfully",
      });
    } else if (paymentIntent.status === "processing") {
      return res.json({
        success: true,
        status: paymentIntent.status,
        message: "Payment is still processing",
      });
    } else {
      return res.json({
        success: false,
        status: paymentIntent.status,
        message: "Payment has not been completed",
      });
    }
  } catch (error) {
    console.error("Error verifying payment status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment status",
    });
  }
}

// Handle Stripe webhook events
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing stripe signature or webhook secret" 
    });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle different webhook events
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleSuccessfulPayment(paymentIntent);
        break;
        
      case "subscription.created":
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
        
      case "subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(updatedSubscription);
        break;
        
      case "subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    res.status(400).json({ 
      success: false, 
      error: "Webhook signature verification failed" 
    });
  }
}

// Handle RevenueCat webhook events
export async function handleRevenueCatWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    
    if (!event || !event.type) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid webhook payload" 
      });
    }
    
    // Handle different RevenueCat webhook events
    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
        await handleRevenueCatPurchase(event);
        break;
        
      case "CANCELLATION":
        await handleRevenueCatCancellation(event);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error("Error handling RevenueCat webhook:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process webhook" 
    });
  }
}

// Helper functions for webhook event handling

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Get user and plan from metadata
    const userId = parseInt(paymentIntent.metadata.userId || "0");
    const planCode = paymentIntent.metadata.planCode;
    
    if (userId && planCode) {
      // Update the user's subscription plan
      await storage.updateUser(userId, {
        subscriptionPlan: planCode,
        lastPaymentDate: new Date(),
      });
      
      console.log(`Updated user ${userId} to plan ${planCode}`);
    }
  } catch (error) {
    console.error("Error handling successful payment:", error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID
    const customerId = subscription.customer as string;
    
    // Find users with this Stripe customer ID
    const users = await storage.getUserByStripeCustomerId(customerId);
    
    if (users.length > 0) {
      const user = users[0];
      
      // Update the user with the subscription ID and next billing date
      // Use the actual billing period end from Stripe
      const nextBillingTimestamp = subscription.current_period_end * 1000; // Convert to milliseconds
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        nextBillingDate: new Date(nextBillingTimestamp),
      });
      
      console.log(`Created subscription ${subscription.id} for user ${user.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription creation:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID
    const customerId = subscription.customer as string;
    
    // Find users with this Stripe customer ID
    const users = await storage.getUserByStripeCustomerId(customerId);
    
    if (users.length > 0) {
      const user = users[0];
      
      // Update the user's next billing date using the actual period end from Stripe
      const nextBillingTimestamp = subscription.current_period_end * 1000; // Convert to milliseconds
      await storage.updateUser(user.id, {
        nextBillingDate: new Date(nextBillingTimestamp),
      });
      
      console.log(`Updated subscription ${subscription.id} for user ${user.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Get the customer ID
    const customerId = subscription.customer as string;
    
    // Find users with this Stripe customer ID
    const users = await storage.getUserByStripeCustomerId(customerId);
    
    if (users.length > 0) {
      const user = users[0];
      
      // Downgrade the user to the free plan
      await storage.updateUser(user.id, {
        stripeSubscriptionId: null,
        subscriptionPlan: "free", // Assuming "free" is the code for the free plan
      });
      
      console.log(`Deleted subscription ${subscription.id} for user ${user.id}`);
    }
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
  }
}

async function handleRevenueCatPurchase(event: any) {
  try {
    const { app_user_id, product_id } = event;
    
    if (!app_user_id || !product_id) {
      console.error("Missing app_user_id or product_id in RevenueCat event");
      return;
    }
    
    // Map RevenueCat product ID to our plan code
    // This is a simplistic mapping; in production you'd want this in a config or database
    const planMapping: Record<string, string> = {
      "revenuecat_pro": "pro",
      "revenuecat_executive": "executive",
    };
    
    const planCode = planMapping[product_id] || "free";
    
    // The app_user_id in RevenueCat should be set to our user ID
    const userId = parseInt(app_user_id);
    
    if (userId) {
      await storage.updateUser(userId, {
        subscriptionPlan: planCode,
        lastPaymentDate: new Date(),
      });
      
      console.log(`Updated user ${userId} to plan ${planCode} via RevenueCat`);
    }
  } catch (error) {
    console.error("Error handling RevenueCat purchase:", error);
  }
}

async function handleRevenueCatCancellation(event: any) {
  try {
    const { app_user_id } = event;
    
    if (!app_user_id) {
      console.error("Missing app_user_id in RevenueCat event");
      return;
    }
    
    // The app_user_id in RevenueCat should be set to our user ID
    const userId = parseInt(app_user_id);
    
    if (userId) {
      // Downgrade to free plan
      await storage.updateUser(userId, {
        subscriptionPlan: "free",
      });
      
      console.log(`Downgraded user ${userId} to free plan due to RevenueCat cancellation`);
    }
  } catch (error) {
    console.error("Error handling RevenueCat cancellation:", error);
  }
}