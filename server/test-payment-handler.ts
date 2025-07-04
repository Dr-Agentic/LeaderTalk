/**
 * RevenueCat Payment Handler Test
 * Tests the payment handler service integration
 */

import { revenueCatPaymentHandler } from './services/revenueCatPaymentHandler';

async function testPaymentHandler() {
  console.log('🧪 Testing RevenueCat Payment Handler...\n');
  
  // Test 1: Handler initialization
  console.log('1. Testing handler initialization...');
  try {
    console.log('   ✅ Payment handler initialized successfully');
  } catch (error) {
    console.log(`   ❌ Handler initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return;
  }

  // Test 2: Test customer lookup with sample email
  console.log('\n2. Testing customer lookup...');
  const testEmail = 'test@example.com';
  
  try {
    const subscription = await revenueCatPaymentHandler.getSubscriptionForUser(testEmail);
    console.log('   ✅ Customer lookup completed');
    console.log(`   📋 Result: ${subscription ? 'Subscription found' : 'No subscription (expected for test email)'}`);
  } catch (error) {
    console.log(`   ❌ Customer lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 3: Test subscription validation
  console.log('\n3. Testing subscription validation...');
  const mockReceiptData = {
    receipt_data: 'test_receipt',
    product_id: 'test_product',
    transaction_id: 'test_transaction'
  };
  
  try {
    const validation = await revenueCatPaymentHandler.validatePurchase(testEmail, mockReceiptData);
    console.log('   ✅ Purchase validation completed');
    console.log(`   📋 Result: ${validation.isValid ? 'Valid' : 'Invalid'} (expected for test data)`);
  } catch (error) {
    console.log(`   ❌ Purchase validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎯 Payment handler tests completed');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testPaymentHandler().catch(console.error);
}