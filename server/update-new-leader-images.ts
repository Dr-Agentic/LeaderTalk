import { db } from './db';
import { leaders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file directory (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leaderImagesToUpdate = [
  { id: 21, name: 'Elon Musk', imagePath: 'images/leaders/elon-musk.svg' },
  { id: 22, name: 'Satya Nadella', imagePath: 'images/leaders/satya-nadella.svg' },
  { id: 23, name: 'Tim Cook', imagePath: 'images/leaders/tim-cook.svg' },
  { id: 24, name: 'Neal Keny-Guyer', imagePath: 'images/leaders/neal-keny-guyer.svg' },
  { id: 25, name: 'Dianne Calvi', imagePath: 'images/leaders/dianne-calvi.svg' },
  { id: 26, name: 'George Soros', imagePath: 'images/leaders/george-soros.svg' },
  { id: 27, name: 'Jensen Huang', imagePath: 'images/leaders/jensen-huang.svg' },
  { id: 28, name: 'Lisa Su', imagePath: 'images/leaders/lisa-su.svg' },
  { id: 29, name: 'Mary Barra', imagePath: 'images/leaders/mary-barra.svg' },
  { id: 30, name: 'Jamie Dimon', imagePath: 'images/leaders/jamie-dimon.svg' },
  { id: 31, name: 'Brian Moynihan', imagePath: 'images/leaders/brian-moynihan.svg' }
];

async function updateLeaderImages() {
  try {
    console.log('Starting leader image update...');
    
    for (const leader of leaderImagesToUpdate) {
      // Update the leader's image path
      const result = await db.update(leaders)
        .set({ photoUrl: leader.imagePath })
        .where(eq(leaders.id, leader.id))
        .returning();
      
      if (result.length > 0) {
        console.log(`✅ Updated image for ${leader.name} (ID: ${leader.id}) to ${leader.imagePath}`);
      } else {
        console.log(`❌ Failed to update image for ${leader.name} (ID: ${leader.id})`);
      }
    }
    
    console.log('Leader image update complete!');
  } catch (error) {
    console.error('Error updating leader images:', error);
  }
}

// Run the update function
updateLeaderImages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });