import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Script to add Stripe-related columns to the users table
 */
async function updateStripeColumns() {
  try {
    console.log('Adding Stripe columns to users table...');
    
    // Check if stripe_customer_id column exists
    const checkColumnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      // Add stripe_customer_id column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
      `);
      console.log('Added stripe_customer_id column');
    } else {
      console.log('stripe_customer_id column already exists');
    }
    
    // Check if stripe_subscription_id column exists
    const checkSubColumnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
    `);
    
    if (checkSubColumnResult.rows.length === 0) {
      // Add stripe_subscription_id column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT
      `);
      console.log('Added stripe_subscription_id column');
    } else {
      console.log('stripe_subscription_id column already exists');
    }
    
    console.log('Successfully updated database schema for Stripe integration');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
updateStripeColumns();