import Stripe from 'stripe';
import { Request, Response } from 'express';
import { dbStorage as storage } from './dbStorage';

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Create a subscription payment intent
export async function createSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { planCode } = req.body;
    if (!planCode) {
      return res.status(400).json({ success: false, message: 'Plan code is required' });
    }

    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get the subscription plan
    const plan = await storage.getSubscriptionPlanByCode(planCode);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // Convert price to cents
    const amount = parseInt(plan.monthlyPriceUsd) * 100;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid subscription price' });
    }

    // Create or get customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
        },
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await storage.updateUser(userId, {
        stripeCustomerId: customerId,
      });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        userId: user.id.toString(),
        planCode,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      planCode,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while creating the subscription',
    });
  }
}

// Handle Stripe webhook events
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;
  
  // In production, you should verify the webhook signature
  // using a webhook secret from your Stripe dashboard
  // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    let event = req.body;
    
    // If you have a webhook secret, verify the signature
    // if (endpointSecret) {
    //   event = stripe.webhooks.constructEvent(
    //     req.body,
    //     signature,
    //     endpointSecret
    //   );
    // }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
}

// Handle a successful payment
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Extract the metadata
    const { userId, planCode } = paymentIntent.metadata;
    
    if (!userId || !planCode) {
      console.error('Missing metadata in payment intent:', paymentIntent.id);
      return;
    }
    
    // Get the user
    const user = await storage.getUser(parseInt(userId, 10));
    if (!user) {
      console.error('User not found:', userId);
      return;
    }
    
    // Get the subscription plan
    const plan = await storage.getSubscriptionPlanByCode(planCode);
    if (!plan) {
      console.error('Subscription plan not found:', planCode);
      return;
    }
    
    // Calculate subscription expiration date (1 month from now)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    
    // Update the user's subscription
    await storage.updateUser(user.id, {
      subscriptionPlan: planCode,
      subscriptionUpdatedAt: new Date(),
      subscriptionExpirationDate: expirationDate,
    });
    
    console.log(`Subscription activated for user ${user.id}: ${planCode}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    // Get the customer
    const customerId = subscription.customer as string;
    
    // Find the user by Stripe customer ID
    // Note: You need to add methods to find a user by stripeCustomerId in your storage
    const users = await storage.getUserByStripeCustomerId(customerId);
    if (!users || users.length === 0) {
      console.error('User not found for Stripe customer:', customerId);
      return;
    }
    
    const user = users[0];
    
    // Determine plan code from Stripe product
    const item = subscription.items.data[0];
    const productId = item.price.product as string;
    
    // Get the product to determine the plan
    const product = await stripe.products.retrieve(productId);
    
    let planCode = 'starter'; // Default
    
    // Extract plan code from product metadata or name
    if (product.metadata.planCode) {
      planCode = product.metadata.planCode;
    } else if (product.name.toLowerCase().includes('pro')) {
      planCode = 'pro';
    } else if (product.name.toLowerCase().includes('executive')) {
      planCode = 'executive';
    }
    
    // Calculate expiration date
    const expirationDate = new Date(subscription.current_period_end * 1000);
    
    // Update the user's subscription
    await storage.updateUser(user.id, {
      subscriptionPlan: planCode,
      subscriptionUpdatedAt: new Date(),
      subscriptionExpirationDate: expirationDate,
      stripeSubscriptionId: subscription.id,
    });
    
    console.log(`Subscription updated for user ${user.id} to ${planCode}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription cancellations
async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    // Get the customer
    const customerId = subscription.customer as string;
    
    // Find the user by Stripe customer ID
    const users = await storage.getUserByStripeCustomerId(customerId);
    if (!users || users.length === 0) {
      console.error('User not found for Stripe customer:', customerId);
      return;
    }
    
    const user = users[0];
    
    // Get the default (free) subscription plan
    const defaultPlan = await storage.getDefaultSubscriptionPlan();
    
    // Update the user's subscription to the default plan
    await storage.updateUser(user.id, {
      subscriptionPlan: defaultPlan.planCode,
      subscriptionUpdatedAt: new Date(),
      subscriptionExpirationDate: null,
      stripeSubscriptionId: null, // Clear the subscription ID
    });
    
    console.log(`Subscription cancelled for user ${user.id}, reverted to default plan`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

// Verify Stripe payment status (for client-side polling)
export async function verifyPaymentStatus(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.params;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment intent ID is required' 
      });
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return res.status(200).json({
      success: true,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });
  } catch (error: any) {
    console.error('Error verifying payment status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while verifying the payment status',
    });
  }
}