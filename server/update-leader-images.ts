import { db } from "./db";
import { leaders } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function updateLeaderImages() {
  try {
    // Get all leaders from the database
    const allLeaders = await db.select().from(leaders);
    console.log(`Found ${allLeaders.length} leaders in the database`);
    
    const updatedLeaders = [];
    
    for (const leader of allLeaders) {
      // Create the clean SVG filename
      const cleanPhotoUrl = `/images/leaders/${leader.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}-clean.svg`;
      
      // Update the leader with the new clean SVG
      console.log(`Updating ${leader.name} to use ${cleanPhotoUrl}`);
      
      await db.update(leaders)
        .set({ photoUrl: cleanPhotoUrl })
        .where(eq(leaders.id, leader.id));
      
      updatedLeaders.push({
        id: leader.id,
        name: leader.name,
        updated: true
      });
    }
    
    return {
      success: true,
      message: `Updated ${updatedLeaders.length} leader images`,
      updatedLeaders
    };
  } catch (error) {
    console.error("Error updating leader images:", error);
    return {
      success: false,
      message: "Failed to update leader images",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}