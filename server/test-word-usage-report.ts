#!/usr/bin/env tsx

/**
 * Test script to validate the wordUsageReport method
 * This will test with real user data to ensure the method works correctly
 */

import { dbStorage } from "./dbStorage.js";

async function testWordUsageReport() {
  console.log("🧪 Testing wordUsageReport method...\n");

  try {
    // Test with user ID 2 (from the logs we can see this user has recordings)
    const userId = 2;
    
    // Test 1: Current month report
    console.log("📅 Test 1: Current month word usage report");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthlyReport = await dbStorage.wordUsageReport(startOfMonth, endOfMonth, userId);
    
    console.log("Monthly Report Results:");
    console.log(`  📊 Total Word Count: ${monthlyReport.totalWordCount}`);
    console.log(`  🎙️ Recording Count: ${monthlyReport.recordingCount}`);
    console.log(`  📅 First Recording: ${monthlyReport.firstRecordingCreatedAt?.toISOString() || 'None'}`);
    console.log(`  📅 Last Recording: ${monthlyReport.lastRecordingCreatedAt?.toISOString() || 'None'}`);
    
    console.log("\n📝 Individual Recordings:");
    monthlyReport.recordings.forEach(recording => {
      console.log(`  ${recording.order}. ${recording.name} (ID: ${recording.id})`);
      console.log(`     Words: ${recording.wordCount}, Duration: ${recording.duration}s`);
      console.log(`     Created: ${recording.createdAt.toISOString()}`);
    });

    // Test 2: Last 7 days report  
    console.log("\n📅 Test 2: Last 7 days word usage report");
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyReport = await dbStorage.wordUsageReport(sevenDaysAgo, now, userId);
    
    console.log("Weekly Report Results:");
    console.log(`  📊 Total Word Count: ${weeklyReport.totalWordCount}`);
    console.log(`  🎙️ Recording Count: ${weeklyReport.recordingCount}`);
    console.log(`  📅 First Recording: ${weeklyReport.firstRecordingCreatedAt?.toISOString() || 'None'}`);
    console.log(`  📅 Last Recording: ${weeklyReport.lastRecordingCreatedAt?.toISOString() || 'None'}`);

    // Test 3: Custom date range (May 2025)
    console.log("\n📅 Test 3: May 2025 specific date range");
    const mayStart = new Date('2025-05-01T00:00:00.000Z');
    const mayEnd = new Date('2025-05-31T23:59:59.999Z');
    
    const mayReport = await dbStorage.wordUsageReport(mayStart, mayEnd, userId);
    
    console.log("May 2025 Report Results:");
    console.log(`  📊 Total Word Count: ${mayReport.totalWordCount}`);
    console.log(`  🎙️ Recording Count: ${mayReport.recordingCount}`);
    console.log(`  📅 Date Range: ${mayStart.toDateString()} to ${mayEnd.toDateString()}`);

    // Test 4: Edge case - No recordings in range
    console.log("\n📅 Test 4: Empty date range (future dates)");
    const futureStart = new Date('2026-01-01T00:00:00.000Z');
    const futureEnd = new Date('2026-01-31T23:59:59.999Z');
    
    const emptyReport = await dbStorage.wordUsageReport(futureStart, futureEnd, userId);
    
    console.log("Empty Range Report Results:");
    console.log(`  📊 Total Word Count: ${emptyReport.totalWordCount}`);
    console.log(`  🎙️ Recording Count: ${emptyReport.recordingCount}`);
    console.log(`  📅 First Recording: ${emptyReport.firstRecordingCreatedAt || 'None'}`);
    console.log(`  📅 Last Recording: ${emptyReport.lastRecordingCreatedAt || 'None'}`);

    // Test 5: Validate order numbers
    console.log("\n🔢 Test 5: Validating order sequence");
    if (monthlyReport.recordings.length > 0) {
      const orderNumbers = monthlyReport.recordings.map(r => r.order);
      const expectedOrder = Array.from({ length: monthlyReport.recordings.length }, (_, i) => i + 1);
      const isOrderCorrect = JSON.stringify(orderNumbers) === JSON.stringify(expectedOrder);
      
      console.log(`  Order numbers: [${orderNumbers.join(', ')}]`);
      console.log(`  Expected: [${expectedOrder.join(', ')}]`);
      console.log(`  ✅ Order validation: ${isOrderCorrect ? 'PASSED' : 'FAILED'}`);
      
      // Check chronological order
      if (monthlyReport.recordings.length > 1) {
        const isChronological = monthlyReport.recordings.every((recording, index) => {
          if (index === 0) return true;
          return recording.createdAt >= monthlyReport.recordings[index - 1].createdAt;
        });
        console.log(`  ✅ Chronological order: ${isChronological ? 'PASSED' : 'FAILED'}`);
      }
    }

    console.log("\n🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testWordUsageReport()
  .then(() => {
    console.log("✅ Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test script failed:", error);
    process.exit(1);
  });