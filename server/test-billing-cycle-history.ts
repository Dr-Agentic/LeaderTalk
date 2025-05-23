/**
 * Test script for the new getBillingCycleWordUsageHistory function
 * This validates the multi-cycle billing analysis and trend calculations
 */

import { getBillingCycleWordUsageHistory } from './subscriptionController.js';

async function testBillingCycleHistory() {
  try {
    console.log('🧪 Testing Billing Cycle Word Usage History Function');
    console.log('=' .repeat(60));
    
    // Test with a real user ID (adjust as needed)
    const testUserId = 2; // Using user 2 as in previous tests
    const numberOfCycles = 3; // Test 3 cycles including current
    
    console.log(`📊 Generating ${numberOfCycles}-cycle history for user ${testUserId}`);
    console.log('-'.repeat(40));
    
    const historyData = await getBillingCycleWordUsageHistory(testUserId, numberOfCycles);
    
    // Display results
    console.log('\n📈 BILLING CYCLE HISTORY RESULTS:');
    console.log(`User ID: ${historyData.userId}`);
    console.log(`Cycles Analyzed: ${historyData.cyclesAnalyzed}`);
    console.log(`Generated At: ${historyData.generatedAt.toISOString()}`);
    
    // Current cycle summary
    console.log('\n🔥 CURRENT CYCLE:');
    console.log(`Plan: ${historyData.currentCycle.subscription.plan}`);
    console.log(`Word Limit: ${historyData.currentCycle.subscription.wordLimit}`);
    console.log(`Words Used: ${historyData.currentCycle.usageReport.totalWordCount}`);
    console.log(`Usage: ${historyData.currentCycle.analytics.usagePercentage}%`);
    console.log(`Recordings: ${historyData.currentCycle.usageReport.recordingCount}`);
    
    // Historical cycles
    console.log('\n📅 HISTORICAL CYCLES:');
    historyData.historicalCycles.forEach((cycle, index) => {
      console.log(`\nCycle ${cycle.cycleNumber} (${cycle.cycleNumber} cycles ago):`);
      console.log(`  Period: ${cycle.startDate.toISOString().split('T')[0]} to ${cycle.endDate.toISOString().split('T')[0]}`);
      console.log(`  Words Used: ${cycle.usageReport.totalWordCount}`);
      console.log(`  Usage: ${cycle.analytics.usagePercentage}%`);
      console.log(`  Recordings: ${cycle.usageReport.recordingCount}`);
      console.log(`  Avg Words/Recording: ${cycle.analytics.averageWordsPerRecording}`);
    });
    
    // Trend analysis
    console.log('\n📊 TREND ANALYTICS:');
    console.log(`Total Words Across ${numberOfCycles} Cycles: ${historyData.trendAnalytics.totalWordsAcrossCycles}`);
    console.log(`Average Words Per Cycle: ${historyData.trendAnalytics.averageWordsPerCycle}`);
    console.log(`Usage Trend: ${historyData.trendAnalytics.usageTrend.toUpperCase()}`);
    
    console.log('\n📈 CYCLE COMPARISON:');
    historyData.trendAnalytics.cycleComparison.forEach(comparison => {
      console.log(`  ${comparison.cycle}: ${comparison.words} words (${comparison.change})`);
    });
    
    // Validation checks
    console.log('\n✅ VALIDATION CHECKS:');
    
    // Check that all cycles are accounted for
    const expectedCycles = numberOfCycles;
    const actualCycles = 1 + historyData.historicalCycles.length; // current + historical
    console.log(`Expected cycles: ${expectedCycles}, Actual cycles: ${actualCycles} ${expectedCycles === actualCycles ? '✅' : '❌'}`);
    
    // Check trend calculation
    const manualTotal = historyData.currentCycle.usageReport.totalWordCount + 
                       historyData.historicalCycles.reduce((sum, cycle) => sum + cycle.usageReport.totalWordCount, 0);
    console.log(`Manual total: ${manualTotal}, Reported total: ${historyData.trendAnalytics.totalWordsAcrossCycles} ${manualTotal === historyData.trendAnalytics.totalWordsAcrossCycles ? '✅' : '❌'}`);
    
    // Check average calculation
    const manualAverage = Math.round(manualTotal / actualCycles);
    console.log(`Manual average: ${manualAverage}, Reported average: ${historyData.trendAnalytics.averageWordsPerCycle} ${manualAverage === historyData.trendAnalytics.averageWordsPerCycle ? '✅' : '❌'}`);
    
    // Check cycle comparison length
    const expectedComparisons = actualCycles;
    const actualComparisons = historyData.trendAnalytics.cycleComparison.length;
    console.log(`Expected comparisons: ${expectedComparisons}, Actual comparisons: ${actualComparisons} ${expectedComparisons === actualComparisons ? '✅' : '❌'}`);
    
    console.log('\n🎉 Billing cycle history test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing billing cycle history:', error);
    process.exit(1);
  }
}

// Run the test
testBillingCycleHistory();