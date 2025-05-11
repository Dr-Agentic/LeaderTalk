import { db } from './db';
import { leaders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file directory (ESM replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Older leaders with updated titles
const olderLeaderTitles = [
  { id: 6, name: 'Abraham Lincoln', title: '16th President of the United States 1861-1865' },
  { id: 7, name: 'Mahatma Gandhi', title: 'Leader of Indian Independence Movement 1915-1948' },
  { id: 8, name: 'Franklin D. Roosevelt', title: '32nd President of the United States 1933-1945' },
  { id: 9, name: 'Martin Luther King Jr.', title: 'Civil Rights Leader & Activist 1955-1968' },
  { id: 10, name: 'Mother Teresa', title: 'Founder of Missionaries of Charity 1950-1997' }
];

async function updateOlderLeaderTitles() {
  try {
    console.log('Starting older leader title updates...');
    
    for (const leader of olderLeaderTitles) {
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
    
    console.log('Older leader title updates completed!');
  } catch (error) {
    console.error('Error updating older leader titles:', error);
  }
}

// Run the update function
updateOlderLeaderTitles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });