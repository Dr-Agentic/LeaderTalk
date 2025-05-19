import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

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
const secretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(secretKey, {
  apiVersion: "2025-04-30.basil", // Updated to match expected version from the frontend
});

// Fetch products from Stripe API for display in the UI
export async function getStripeProducts(req: Request, res: Response) {
  try {
    // Verify we have a valid secret key
    if (!secretKey || secretKey.trim() === '') {
      console.log("Missing Stripe secret key, using database subscription plans instead");
      
      // Fallback to getting subscription plans from our database
      const plans = await storage.getSubscriptionPlans();
      
      // Convert the database plans to a format compatible with the Stripe Product API
      // This allows our frontend to work without changes
      const products = plans.map(plan => {
        const priceInCents = Math.round(parseFloat(plan.monthlyPriceUsd) * 100);
        return {
          id: `prod_${plan.code}`,
          name: plan.name,
          description: `${plan.name} - ${plan.monthlyWordLimit} words per month`,
          active: true,
          features: plan.features ? plan.features.split(',').map(f => f.trim()) : [],
          prices: [{
            id: `price_${plan.code}`,
            product: `prod_${plan.code}`,
            unit_amount: priceInCents,
            currency: 'usd',
            recurring: { interval: 'month' }
          }]
        };
      });
      
      // Sort by price (ascending)
      products.sort((a, b) => {
        const aPrice = a.prices[0]?.unit_amount || 0;
        const bPrice = b.prices[0]?.unit_amount || 0;
        return aPrice - bPrice;
      });
      
      console.log(`Using ${products.length} subscription plans from database`);
      
      return res.json({
        success: true,
        products,
        source: 'database' // Add metadata so frontend knows data source
      });
    }
    
    console.log("Fetching products from Stripe API...");
    
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
    
    try {
      // Fallback to database plans if Stripe API fails for any reason
      console.log("Falling back to database subscription plans");
      const plans = await storage.getSubscriptionPlans();
      
      const products = plans.map(plan => {
        const priceInCents = Math.round(parseFloat(plan.monthlyPriceUsd) * 100);
        return {
          id: `prod_${plan.code}`,
          name: plan.name,
          description: `${plan.name} - ${plan.monthlyWordLimit} words per month`,
          active: true,
          features: plan.features ? plan.features.split(',').map(f => f.trim()) : [],
          prices: [{
            id: `price_${plan.code}`,
            product: `prod_${plan.code}`,
            unit_amount: priceInCents,
            currency: 'usd',
            recurring: { interval: 'month' }
          }]
        };
      });
      
      products.sort((a, b) => {
        const aPrice = a.prices[0]?.unit_amount || 0;
        const bPrice = b.prices[0]?.unit_amount || 0;
        return aPrice - bPrice;
      });
      
      return res.json({
        success: true,
        products,
        source: 'database',
        note: 'Using database plans due to Stripe API error'
      });
    } catch (dbError) {
      // If both Stripe and database fallback fail
      console.error("Failed to fall back to database plans:", dbError);
      
      // Provide more detailed error for better troubleshooting
      let errorMessage = "Failed to fetch subscription products";
      if (error.type || error.code) {
        errorMessage += `: ${error.message || "Unknown error"}`;
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
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

    // Fetch the price from Stripe to get product details
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });

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