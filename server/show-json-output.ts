/**
 * Simple script to show the raw JSON output from getBillingCycleWordUsageHistory
 */

import { getBillingCycleWordUsageHistory } from './billingService.js';

async function showJsonOutput() {
  try {
    console.log('🔄 Fetching billing cycle history data...\n');
    
    const jsonData = await getBillingCycleWordUsageHistory(2, 3);
    
    console.log('📄 RAW JSON OUTPUT:');
    console.log('=' .repeat(80));
    console.log(JSON.stringify(jsonData, null, 2));
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

showJsonOutput();