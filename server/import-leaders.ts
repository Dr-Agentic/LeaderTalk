import fs from "fs";
import path from "path";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { leaders } from "@shared/schema";

export async function importLeadersFromFile() {
  try {
    // Read the JSON file with leaders data
    const filePath = path.join(process.cwd(), 'attached_assets', 'leaders_data.json');
    console.log(`Reading leaders data from ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error("Leaders data file not found");
      return { success: false, message: "Leaders data file not found" };
    }

    const leadersData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${leadersData.length} leaders in the file`);

    // Get all existing leaders from database
    const existingLeaders = await db.select().from(leaders);
    console.log(`Found ${existingLeaders.length} leaders in the database`);

    // Track which leaders were updated
    const updatedLeaders = [];
    // Track which leaders need to be inserted
    const newLeaders = [];

    for (const leaderData of leadersData) {
      // Check if leader already exists
      const dbLeader = existingLeaders.find(
        l => l.name.toLowerCase() === leaderData.name.toLowerCase()
      );

      if (dbLeader) {
        // Update the existing leader with the new data
        console.log(`Updating leader: ${leaderData.name}`);
        
        await db.update(leaders)
          .set({
            controversial: !!leaderData.controversial,
            generationMostAffected: leaderData.generation_most_affected || null,
            leadershipStyles: JSON.stringify(leaderData.leadership_styles || []),
            famousPhrases: JSON.stringify(leaderData.famous_phrases || []),
            photoUrl: `/images/leaders/${leaderData.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}-clean.svg`
          })
          .where(eq(leaders.id, dbLeader.id));
        
        updatedLeaders.push({
          id: dbLeader.id,
          name: dbLeader.name,
          updated: true
        });
      } else {
        // This is a new leader to insert
        console.log(`Adding new leader: ${leaderData.name}`);
        
        // For new leaders, we need more details than just the controversial flag
        newLeaders.push({
          name: leaderData.name,
          title: `${leaderData.name}'s Leadership`,
          description: `${leaderData.name}'s communication style`,
          traits: JSON.stringify(leaderData.leadership_styles || []),
          biography: `Leader information for ${leaderData.name}`,
          photoUrl: `/images/leaders/${leaderData.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}-clean.svg`,
          controversial: !!leaderData.controversial,
          generationMostAffected: leaderData.generation_most_affected || null,
          leadershipStyles: JSON.stringify(leaderData.leadership_styles || []),
          famousPhrases: JSON.stringify(leaderData.famous_phrases || [])
        });
      }
    }
    
    // Insert any new leaders
    if (newLeaders.length > 0) {
      const insertedLeaders = await db.insert(leaders).values(newLeaders).returning();
      console.log(`Inserted ${insertedLeaders.length} new leaders`);
      
      // Add to the updated leaders list
      for (const leader of insertedLeaders) {
        updatedLeaders.push({
          id: leader.id,
          name: leader.name,
          added: true
        });
      }
    }
    
    return { 
      success: true, 
      message: `Updated ${updatedLeaders.length} leaders`,
      updatedLeaders 
    };
  } catch (error) {
    console.error("Error importing leaders data:", error);
    return { 
      success: false, 
      message: "Failed to import leaders data", 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
