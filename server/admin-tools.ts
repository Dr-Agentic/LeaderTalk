import { db } from "./db";
import {
  users, recordings, userProgress, situationAttempts, userWordUsage
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Admin tool script to manage users for testing purposes
 * Usage:
 *   1. List all users: tsx server/admin-tools.ts list
 *   2. Clean a user's records: tsx server/admin-tools.ts clean <user_id>
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  if (command === 'list') {
    await listUsers();
  } else if (command === 'clean' && args[1]) {
    const userId = parseInt(args[1]);
    if (isNaN(userId)) {
      console.error('Invalid user ID. Please provide a numeric user ID.');
      process.exit(1);
    }
    await cleanUserRecords(userId);
  } else {
    console.log('Usage:');
    console.log('  List all users: tsx server/admin-tools.ts list');
    console.log('  Clean a user\'s records: tsx server/admin-tools.ts clean <user_id>');
  }
  
  // Close the database connection
  await db.end();
}

/**
 * List all users in the system with their IDs, names, emails, and record counts
 */
async function listUsers() {
  console.log('Fetching all users...');
  
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    googleId: users.googleId,
    createdAt: users.createdAt
  }).from(users);
  
  console.log('\nUser List:');
  console.log('==========');
  
  if (allUsers.length === 0) {
    console.log('No users found.');
    return;
  }
  
  // For each user, get record counts
  for (const user of allUsers) {
    // Count recordings
    const recordingsCount = await db.select({ count: recordings.id })
      .from(recordings)
      .where(eq(recordings.userId, user.id))
      .then(result => result.length);
    
    // Count progress records
    const progressCount = await db.select({ count: userProgress.id })
      .from(userProgress)
      .where(eq(userProgress.userId, user.id))
      .then(result => result.length);
    
    // Count situation attempts
    const attemptsCount = await db.select({ count: situationAttempts.id })
      .from(situationAttempts)
      .where(eq(situationAttempts.userId, user.id))
      .then(result => result.length);
    
    // Count word usage records
    const wordUsageCount = await db.select({ count: userWordUsage.id })
      .from(userWordUsage)
      .where(eq(userWordUsage.userId, user.id))
      .then(result => result.length);
    
    // Format creation date
    const createdDate = user.createdAt ? 
      new Date(user.createdAt).toLocaleString() : 'N/A';
    
    // Display user with record counts
    console.log(`ID: ${user.id}`);
    console.log(`  Name: ${user.username || 'N/A'}`);
    console.log(`  Email: ${user.email || 'N/A'}`);
    console.log(`  Google ID: ${user.googleId || 'N/A'}`);
    console.log(`  Created: ${createdDate}`);
    console.log(`  Records:`);
    console.log(`    - Recordings: ${recordingsCount}`);
    console.log(`    - Progress items: ${progressCount}`);
    console.log(`    - Situation attempts: ${attemptsCount}`);
    console.log(`    - Word usage entries: ${wordUsageCount}`);
    console.log('----------');
  }
  
  console.log(`\nTotal users: ${allUsers.length}`);
  console.log('\nTo clean a user\'s records: tsx server/admin-tools.ts clean <user_id>');
}

/**
 * Clean all records for a specific user ID
 * This keeps the user but removes all their associated data
 */
async function cleanUserRecords(userId: number) {
  // First, verify the user exists
  const user = await db.select({
    id: users.id,
    username: users.username,
    email: users.email
  })
  .from(users)
  .where(eq(users.id, userId))
  .then(result => result[0]);
  
  if (!user) {
    console.error(`Error: User with ID ${userId} not found.`);
    process.exit(1);
  }
  
  console.log(`Preparing to clean records for user: ${user.username} (${user.email}), ID: ${user.id}`);
  console.log('This will remove ALL user data but keep the user account.');
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  
  // Add a short delay to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\nCleaning records...');
  
  // Delete recordings
  console.log('- Deleting recordings...');
  const deletedRecordings = await db.delete(recordings)
    .where(eq(recordings.userId, userId))
    .returning({ id: recordings.id });
  console.log(`  Deleted ${deletedRecordings.length} recordings.`);
  
  // Delete progress records
  console.log('- Deleting progress records...');
  const deletedProgress = await db.delete(userProgress)
    .where(eq(userProgress.userId, userId))
    .returning({ id: userProgress.id });
  console.log(`  Deleted ${deletedProgress.length} progress records.`);
  
  // Delete situation attempts
  console.log('- Deleting situation attempts...');
  const deletedAttempts = await db.delete(situationAttempts)
    .where(eq(situationAttempts.userId, userId))
    .returning({ id: situationAttempts.id });
  console.log(`  Deleted ${deletedAttempts.length} situation attempts.`);
  
  // Delete word usage records
  console.log('- Deleting word usage records...');
  const deletedWordUsage = await db.delete(userWordUsage)
    .where(eq(userWordUsage.userId, userId))
    .returning({ id: userWordUsage.id });
  console.log(`  Deleted ${deletedWordUsage.length} word usage records.`);
  
  // Reset user onboarding fields (optional)
  console.log('- Resetting user onboarding data...');
  await db.update(users)
    .set({
      dateOfBirth: null,
      profession: null,
      goals: null,
      selectedLeaders: null
    })
    .where(eq(users.id, userId));
  
  console.log('\nCleanup complete!');
  console.log(`User ${user.username} (ID: ${userId}) has been reset to a clean state.`);
  console.log('The user account still exists but all associated data has been removed.');
}

// Run the script
main().catch(err => {
  console.error('Error executing admin tool:', err);
  process.exit(1);
});