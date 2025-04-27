import { db } from "./db";
import { sql } from "drizzle-orm";

async function addCreatedByColumn() {
  try {
    console.log("Adding createdBy column to leader_alternatives table...");
    
    // Check if the column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leader_alternatives' AND column_name = 'created_by'
    `;
    
    const result = await db.execute(checkColumnQuery);
    
    if (result.length > 0) {
      console.log("Column created_by already exists in leader_alternatives table.");
      return;
    }
    
    // Add the column if it doesn't exist
    const addColumnQuery = sql`
      ALTER TABLE leader_alternatives 
      ADD COLUMN created_by INTEGER REFERENCES users(id)
    `;
    
    await db.execute(addColumnQuery);
    console.log("Successfully added createdBy column to leader_alternatives table!");
  } catch (error) {
    console.error("Error adding column:", error);
  } finally {
    // No need to close the connection as it will close automatically 
    // when the script exits
    console.log("Script completed.");
  }
}

// Run the function
addCreatedByColumn();