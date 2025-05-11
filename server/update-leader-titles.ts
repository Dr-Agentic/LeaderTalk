import { db } from './db';
import { leaders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file directory (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leaders with updated titles
const leaderTitles = [
  { id: 22, name: 'Satya Nadella', title: 'CEO of Microsoft since 2014' },
  { id: 23, name: 'Tim Cook', title: 'CEO of Apple, Inc. since 2011' },
  { id: 24, name: 'Neal Keny-Guyer', title: 'Former CEO of Mercy Corps 1994-2019' },
  { id: 25, name: 'Dianne Calvi', title: 'CEO of Village Enterprise since 2010' },
  { id: 27, name: 'Jensen Huang', title: 'Co-founder & CEO of NVIDIA since 1993' },
  { id: 28, name: 'Lisa Su', title: 'President & CEO of AMD since 2014' },
  { id: 29, name: 'Mary Barra', title: 'Chair & CEO of General Motors since 2014' },
  { id: 30, name: 'Jamie Dimon', title: 'Chairman & CEO of JPMorgan Chase since 2005' },
  { id: 31, name: 'Brian Moynihan', title: 'President & CEO of Bank of America since 2010' }
];

async function updateLeaderTitles() {
  try {
    console.log('Starting leader title updates...');
    
    for (const leader of leaderTitles) {
      // Update the leader's title
      const result = await db.update(leaders)
        .set({ title: leader.title })
        .where(eq(leaders.id, leader.id))
        .returning({ id: leaders.id, name: leaders.name, title: leaders.title });
      
      if (result.length > 0) {
        console.log(`✅ Updated title for ${leader.name} (ID: ${leader.id})`);
        console.log(`   New title: "${result[0].title}"`);
      } else {
        console.log(`❌ Failed to update title for ${leader.name} (ID: ${leader.id})`);
      }
    }
    
    console.log('Leader title updates completed!');
  } catch (error) {
    console.error('Error updating leader titles:', error);
  }
}

// Run the update function
updateLeaderTitles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });