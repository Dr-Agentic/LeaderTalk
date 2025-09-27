import fs from "fs";
import path from "path";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { leaders } from "@shared/schema";

export async function importLeadersFromFile() {
  try {
    // Read both leader data files - regular and controversial
    const filePath = path.join(process.cwd(), 'server/data/leaders', 'leaders_data.json');
    const controversialPath = path.join(process.cwd(), 'server/data/leaders', 'controversial_leaders.json');
    console.log(`Reading leaders data from ${filePath} and ${controversialPath}`);

    // Define leader data interface to match JSON structure
    interface LeaderData {
      name: string;
      generation_most_affected?: string;
      leadership_styles?: string[];
      famous_phrases?: string[];
      controversial?: boolean;
    }
    
    let allLeadersData: LeaderData[] = [];
    
    // Get leaders from the main data file
    if (fs.existsSync(filePath)) {
      const leadersData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as LeaderData[];
      console.log(`Found ${leadersData.length} leaders in the main file`);
      allLeadersData = allLeadersData.concat(leadersData);
    } else {
      console.log("Main leaders data file not found");
    }
    
    // Get controversial leaders data
    if (fs.existsSync(controversialPath)) {
      const controversialData = JSON.parse(fs.readFileSync(controversialPath, 'utf8')) as LeaderData[];
      console.log(`Found ${controversialData.length} leaders in the controversial file`);
      allLeadersData = allLeadersData.concat(controversialData);
    } else {
      console.log("Controversial leaders data file not found");
    }
    
    if (allLeadersData.length === 0) {
      console.error("No leaders data found in any file");
      return { success: false, message: "No leaders data found" };
    }
    
    console.log(`Total ${allLeadersData.length} leaders to process`);

    // Get all existing leaders from database
    const existingLeaders = await db.select().from(leaders);
    console.log(`Found ${existingLeaders.length} leaders in the database`);

    // Track which leaders were updated
    const updatedLeaders = [];
    // Track which leaders need to be inserted
    const newLeaders = [];

    for (const leaderData of allLeadersData) {
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
            leadershipStyles: leaderData.leadership_styles || [],
            famousPhrases: leaderData.famous_phrases || [],
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
          traits: leaderData.leadership_styles || [],
          biography: `Leader information for ${leaderData.name}`,
          photoUrl: `/images/leaders/${leaderData.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}-clean.svg`,
          controversial: !!leaderData.controversial,
          generationMostAffected: leaderData.generation_most_affected || null,
          leadershipStyles: leaderData.leadership_styles || [],
          famousPhrases: leaderData.famous_phrases || []
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
