import { db } from './db';
import { leaders } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leaders to be removed (by name)
const leadersToRemove = [
  'Xi Jinping',
  'Vladimir Putin',
  'Joseph Stalin',
  'Vladimir Lenin',
  'Ali Khamenei',
  'Elon Musk',
  'George Soros'
];

async function removeControversialLeaders() {
  try {
    console.log('Starting removal of controversial leaders...');
    
    // First, get the IDs and image paths of the leaders to be removed
    const leaderRecords = await db.select({
      id: leaders.id,
      name: leaders.name,
      photoUrl: leaders.photoUrl
    })
    .from(leaders)
    .where(inArray(leaders.name, leadersToRemove));
    
    console.log(`Found ${leaderRecords.length} leaders to remove:`);
    leaderRecords.forEach(leader => {
      console.log(`- ${leader.name} (ID: ${leader.id})`);
    });
    
    // Delete their SVG images if they exist
    for (const leader of leaderRecords) {
      if (leader.photoUrl) {
        const imagePath = path.join(__dirname, '../public', leader.photoUrl);
        
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`✅ Deleted image file: ${imagePath}`);
          } else {
            console.log(`⚠️ Image file not found: ${imagePath}`);
          }
        } catch (error) {
          console.error(`❌ Error deleting image for ${leader.name}:`, error);
        }
      }
    }
    
    // Get the IDs of the leaders to remove
    const leaderIds = leaderRecords.map(leader => leader.id);
    
    // Remove the leaders from the database
    if (leaderIds.length > 0) {
      const result = await db.delete(leaders)
        .where(inArray(leaders.id, leaderIds))
        .returning({ id: leaders.id, name: leaders.name });
      
      console.log(`✅ Removed ${result.length} leaders from the database:`);
      result.forEach(leader => {
        console.log(`  - ${leader.name} (ID: ${leader.id})`);
      });
    } else {
      console.log('❌ No leaders found to remove.');
    }
    
    console.log('Controversial leaders removal completed!');
  } catch (error) {
    console.error('Error removing controversial leaders:', error);
  }
}

// Run the removal function
removeControversialLeaders()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });