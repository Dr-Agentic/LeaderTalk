import { db } from './db';
import { leaders } from '@shared/schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LeaderData {
  name: string;
  generation_most_affected?: string;
  leadership_styles?: string[];
  famous_phrases?: string[];
  controversial?: boolean;
}

async function importLeadersFromUpdatedJson() {
  try {
    console.log('Starting leader import from updated JSON file...');
    
    // Read the JSON file
    const filePath = path.join(__dirname, '../attached_assets/updated_leaders.json');
    console.log(`Reading from file: ${filePath}`);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const leaders_data: LeaderData[] = JSON.parse(rawData);
    
    console.log(`Read ${leaders_data.length} leaders from file`);
    
    // Get existing leaders to avoid duplicates
    const existingLeaders = await db.select().from(leaders);
    const existingLeaderNames = new Set(existingLeaders.map(l => l.name.toLowerCase()));
    
    console.log(`Found ${existingLeaders.length} existing leaders in database`);
    
    // Filter out leaders that already exist
    const newLeaders = leaders_data.filter(leader => 
      !existingLeaderNames.has(leader.name.toLowerCase())
    );
    
    console.log(`Found ${newLeaders.length} new leaders to import`);
    
    if (newLeaders.length === 0) {
      console.log('No new leaders to import. Exiting.');
      return;
    }
    
    // Insert the new leaders
    const results = await db.insert(leaders).values(
      newLeaders.map(leader => ({
        name: leader.name,
        title: `${leader.name}, Leader`,
        description: `A ${leader.leadership_styles?.join(", ") || "notable"} leader`,
        traits: leader.leadership_styles || [],
        biography: `${leader.name} is known for ${leader.famous_phrases?.[0] || "their leadership"}.`,
        controversial: leader.controversial || false,
        generationMostAffected: leader.generation_most_affected || null,
        leadershipStyles: leader.leadership_styles || [],
        famousPhrases: leader.famous_phrases || [],
        photoUrl: null,
      }))
    ).returning();
    
    console.log(`Successfully imported ${results.length} new leaders:`);
    results.forEach(leader => {
      console.log(`- ${leader.name} (ID: ${leader.id})`);
    });
    
  } catch (error) {
    console.error('Error importing leaders:', error);
  }
}

// Run the import function
importLeadersFromUpdatedJson()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });