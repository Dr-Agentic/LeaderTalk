import { Request, Response } from 'express';
import { dbStorage as storage } from './dbStorage';

// Update user subscription based on RevenueCat purchase
export async function updateUserSubscription(req: Request, res: Response) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { planCode } = req.body;
    if (!planCode) {
      return res.status(400).json({ success: false, message: 'Plan code is required' });
    }

    // Get the subscription plan from the database
    const plan = await storage.getSubscriptionPlanByCode(planCode);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // Update the user's subscription
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update the user with the new subscription plan code
    const updatedUser = await storage.updateUser(userId, {
      subscriptionPlan: planCode,
      subscriptionUpdatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the subscription',
    });
  }
}

// Verify a webhook from RevenueCat
export async function handleRevenueCatWebhook(req: Request, res: Response) {
  try {
    // In production, you should verify the webhook signature
    // For details: https://docs.revenuecat.com/docs/webhooks

    const event = req.body;
    
    // Process different RevenueCat webhook events
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'NON_RENEWING_PURCHASE':
        await handleSubscriptionActivation(event);
        break;
      case 'CANCELLATION':
      case 'EXPIRATION':
        await handleSubscriptionDeactivation(event);
        break;
      case 'PRODUCT_CHANGE':
        await handleSubscriptionChange(event);
        break;
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing RevenueCat webhook:', error);
    return res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
}

// Handle subscription activation events
async function handleSubscriptionActivation(event: any) {
  try {
    // Get the user from the app_user_id
    const appUserId = event.app_user_id;
    
    // Get the entitlement identifier which maps to our subscription plan
    const entitlementIdentifier = Object.keys(event.entitlements)[0];
    const productIdentifier = event.product_id;
    
    // Map RevenueCat subscription to our plan code
    let planCode = 'starter'; // Default fallback
    
    if (productIdentifier.includes('pro')) {
      planCode = 'pro';
    } else if (productIdentifier.includes('executive')) {
      planCode = 'executive';
    }
    
    // Get the subscription plan from the database
    const plan = await storage.getSubscriptionPlanByCode(planCode);
    if (!plan) {
      console.error('Subscription plan not found:', planCode);
      return;
    }
    
    // Find the user by the RevenueCat app_user_id (which should be our userId)
    const user = await storage.getUser(parseInt(appUserId, 10));
    if (!user) {
      console.error('User not found for app_user_id:', appUserId);
      return;
    }
    
    // Update the user's subscription
    await storage.updateUser(user.id, {
      subscriptionPlan: planCode,
      subscriptionUpdatedAt: new Date(),
      subscriptionExpirationDate: new Date(event.expiration_at_ms),
    });
    
    console.log(`Subscription activated for user ${user.id}: ${planCode}`);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

// Handle subscription deactivation events
async function handleSubscriptionDeactivation(event: any) {
  try {
    // Get the user from the app_user_id
    const appUserId = event.app_user_id;
    
    // Find the user by the RevenueCat app_user_id
    const user = await storage.getUser(parseInt(appUserId, 10));
    if (!user) {
      console.error('User not found for app_user_id:', appUserId);
      return;
    }
    
    // Get the default (free) subscription plan
    const defaultPlan = await storage.getDefaultSubscriptionPlan();
    
    // Update the user's subscription to the default plan
    await storage.updateUser(user.id, {
      subscriptionPlan: defaultPlan.planCode,
      subscriptionUpdatedAt: new Date(),
      subscriptionExpirationDate: null,
    });
    
    console.log(`Subscription deactivated for user ${user.id}, reverted to default plan`);
  } catch (error) {
    console.error('Error handling subscription deactivation:', error);
  }
}

// Handle subscription change events
async function handleSubscriptionChange(event: any) {
  try {
    // This is similar to activation but for plan changes
    const appUserId = event.app_user_id;
    
    // Get the new entitlement identifier
    const entitlementIdentifier = Object.keys(event.entitlements)[0];
    const productIdentifier = event.product_id;
    
    // Map RevenueCat subscription to our plan code
    let planCode = 'starter'; // Default fallback
    
    if (productIdentifier.includes('pro')) {
      planCode = 'pro';
    } else if (productIdentifier.includes('executive')) {
      planCode = 'executive';
    }
    
    // Get the subscription plan from the database
    const plan = await storage.getSubscriptionPlanByCode(planCode);
    if (!plan) {
      console.error('Subscription plan not found:', planCode);
      return;
    }
    
    // Find the user by the RevenueCat app_user_id
    const user = await storage.getUser(parseInt(appUserId, 10));
    if (!user) {
      console.error('User not found for app_user_id:', appUserId);
      return;
    }
    
    // Update the user's subscription
    await storage.updateUser(user.id, {
      subscriptionPlan: planCode,
      subscriptionUpdatedAt: new Date(),
      subscriptionExpirationDate: new Date(event.expiration_at_ms),
    });
    
    console.log(`Subscription changed for user ${user.id} to ${planCode}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}