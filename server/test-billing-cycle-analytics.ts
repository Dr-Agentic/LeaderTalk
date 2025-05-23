#!/usr/bin/env tsx

import { getBillingCycleWordUsageAnalytics } from "./billingService.js";

async function testBillingCycleAnalytics() {
  console.log("🧪 Testing getBillingCycleWordUsageAnalytics function...");
  
  try {
    // Test with user ID 2 (has real subscription and usage data)
    const analytics = await getBillingCycleWordUsageAnalytics(2);
    
    console.log("\n📊 Billing Cycle Analytics Results:");
    console.log(`✅ Subscription: ${analytics.subscription.plan} (${analytics.subscription.status})`);
    console.log(`💰 Word Limit: ${analytics.subscription.wordLimit}`);
    console.log(`📈 Usage: ${analytics.usageReport.totalWordCount} words (${analytics.analytics.usagePercentage}%)`);
    console.log(`🎙️ Recordings: ${analytics.usageReport.recordingCount} total`);
    console.log(`⏱️  Average Duration: ${analytics.analytics.averageDurationPerRecording}s per recording`);
    console.log(`📅 Billing Period: ${analytics.subscription.currentPeriodStart.toISOString().split('T')[0]} to ${analytics.subscription.currentPeriodEnd.toISOString().split('T')[0]}`);
    
    if (analytics.analytics.hasExceededLimit) {
      console.log(`⚠️  LIMIT EXCEEDED: ${analytics.usageReport.totalWordCount - analytics.subscription.wordLimit} words over limit`);
    } else {
      console.log(`✅ Within Limit: ${analytics.analytics.remainingWords} words remaining`);
    }
    
    console.log("\n🎉 Function test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testBillingCycleAnalytics();