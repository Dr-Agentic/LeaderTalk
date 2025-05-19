import { db } from "./db";
import { sql } from "drizzle-orm";
import { users } from "@shared/schema";

/**
 * Script to add next billing date column to the users table
 * This helps track when the user's subscription will renew
 */
async function updateUserBillingColumns() {
  try {
    console.log("Checking if nextBillingDate column exists...");
    
    // Check if column exists first
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'next_billing_date'
    `);
    
    if (checkColumn.length > 0) {
      console.log("Column already exists, no need to update.");
      return;
    }
    
    console.log("Adding nextBillingDate column to users table...");
    
    // Add the column for next billing date
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN next_billing_date TIMESTAMP
    `);
    
    console.log("Successfully updated users table with next billing date column!");
  } catch (error) {
    console.error("Error updating users table:", error);
  }
}

// Run the script immediately when imported
updateUserBillingColumns()
  .then(() => {
    console.log("Update completed.");
  })
  .catch((err) => {
    console.error("Update failed:", err);
  });

export { updateUserBillingColumns };