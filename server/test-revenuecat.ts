/**
 * RevenueCat Connection Test Script
 * Tests RevenueCat API connectivity and configuration
 */

import { config } from './config/environment';

interface RevenueCatTestResult {
  configStatus: 'valid' | 'missing' | 'invalid';
  apiConnection: 'success' | 'failed' | 'untested';
  projectAccess: 'success' | 'failed' | 'untested';
  details: string[];
}

/**
 * Test RevenueCat configuration and API connectivity
 */
async function testRevenueCatConnection(): Promise<RevenueCatTestResult> {
  const result: RevenueCatTestResult = {
    configStatus: 'missing',
    apiConnection: 'untested',
    projectAccess: 'untested',
    details: []
  };

  console.log('🧪 Testing RevenueCat Configuration...\n');

  // Test 1: Configuration validation
  console.log('1. Checking environment configuration...');
  
  if (!config.revenueCat.secretKey) {
    result.details.push('❌ REVENUECAT_SECRET_KEY not configured');
    console.log('   ❌ Secret key missing');
  } else {
    result.details.push('✅ Secret key configured');
    console.log(`   ✅ Secret key: ${config.revenueCat.secretKey.slice(0, 12)}...`);
    result.configStatus = 'valid';
  }

  if (!config.revenueCat.projectId) {
    result.details.push('❌ REVENUECAT_PROJECT_ID not configured');
    console.log('   ❌ Project ID missing');
  } else {
    result.details.push('✅ Project ID configured');
    console.log(`   ✅ Project ID: ${config.revenueCat.projectId}`);
  }

  if (config.revenueCat.publicKey) {
    result.details.push('✅ Public key configured');
    console.log(`   ✅ Public key: ${config.revenueCat.publicKey.slice(0, 12)}...`);
  } else {
    result.details.push('⚠️ Public key not configured (optional)');
    console.log('   ⚠️ Public key not set (optional)');
  }

  // Skip API tests if configuration is missing
  if (result.configStatus !== 'valid') {
    console.log('\n❌ Skipping API tests due to missing configuration');
    return result;
  }

  // Test 2: Basic API connectivity
  console.log('\n2. Testing API connectivity...');
  
  try {
    const response = await fetch('https://api.revenuecat.com/v2/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.revenueCat.secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      result.apiConnection = 'success';
      result.details.push('✅ API connection successful');
      console.log('   ✅ Connected to RevenueCat API');
      
      const projects = await response.json();
      console.log(`   📊 Found ${projects.items?.length || 0} projects`);
      
    } else {
      result.apiConnection = 'failed';
      result.details.push(`❌ API connection failed: ${response.status} ${response.statusText}`);
      console.log(`   ❌ API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        result.configStatus = 'invalid';
        console.log('   🔑 Invalid API key - check your secret key');
      }
    }
  } catch (error) {
    result.apiConnection = 'failed';
    result.details.push(`❌ API connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`   ❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Test 3: Project-specific access
  if (result.apiConnection === 'success' && config.revenueCat.projectId) {
    console.log('\n3. Testing project access...');
    
    try {
      const projectResponse = await fetch(`https://api.revenuecat.com/v2/projects/${config.revenueCat.projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.revenueCat.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (projectResponse.ok) {
        result.projectAccess = 'success';
        result.details.push('✅ Project access verified');
        console.log('   ✅ Project access verified');
        
        const projectData = await projectResponse.json();
        console.log(`   📋 Project: ${projectData.display_name || 'Unnamed'}`);
        console.log(`   🏷️  Type: ${projectData.type || 'Unknown'}`);
        
      } else {
        result.projectAccess = 'failed';
        result.details.push(`❌ Project access failed: ${projectResponse.status}`);
        console.log(`   ❌ Project access error: ${projectResponse.status} ${projectResponse.statusText}`);
        
        if (projectResponse.status === 404) {
          console.log('   🔍 Project not found - check your project ID');
        }
      }
    } catch (error) {
      result.projectAccess = 'failed';
      result.details.push(`❌ Project access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`   ❌ Project error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Test RevenueCat customer lookup functionality
 */
async function testCustomerLookup(): Promise<void> {
  if (config.revenueCat.secretKey && config.revenueCat.projectId) {
    console.log('\n4. Testing customer lookup...');
    
    // Test with a sample email pattern
    const testEmail = 'test@example.com';
    const customerId = testEmail.replace('@', '_').replace(/[^0-9a-zA-Z_-]/g, '');
    
    try {
      const customerResponse = await fetch(`https://api.revenuecat.com/v2/projects/${config.revenueCat.projectId}/customers/${customerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.revenueCat.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (customerResponse.ok) {
        console.log('   ✅ Customer lookup endpoint accessible');
      } else if (customerResponse.status === 404) {
        console.log('   ✅ Customer lookup working (404 expected for non-existent customer)');
      } else {
        console.log(`   ⚠️ Customer lookup returned: ${customerResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Customer lookup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 RevenueCat Connection Test\n');
  console.log('=' .repeat(50));
  
  const result = await testRevenueCatConnection();
  await testCustomerLookup();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Summary:');
  console.log(`   Configuration: ${result.configStatus}`);
  console.log(`   API Connection: ${result.apiConnection}`);
  console.log(`   Project Access: ${result.projectAccess}`);
  
  console.log('\n📝 Details:');
  result.details.forEach(detail => console.log(`   ${detail}`));
  
  if (result.configStatus === 'valid' && result.apiConnection === 'success' && result.projectAccess === 'success') {
    console.log('\n🎉 RevenueCat connection is fully operational!');
  } else {
    console.log('\n⚠️ RevenueCat setup needs attention. See details above.');
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testRevenueCatConnection, testCustomerLookup };