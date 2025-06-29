/**
 * RevenueCat Payment Handler Test Script
 * Usage: tsx server/test-revenuecat.ts [command] [args...]
 * 
 * Commands:
 *   test-connection - Test basic API connectivity
 *   get-offerings - Fetch all available offerings
 *   get-product <productId> - Get specific product details
 *   get-customer <email> - Get customer by email
 *   create-customer <email> - Create new customer
 *   get-subscriptions <email> - Get customer's subscriptions
 *   get-entitlements <email> - Get customer's entitlements
 *   check-active <email> - Check if customer has active subscription
 *   get-package <offeringId> <packageId> - Get specific package
 */

import { revenueCatHandler } from './services/revenueCatPaymentHandler';

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  console.log('🚀 RevenueCat Payment Handler Test Script');
  console.log('==========================================\n');

  try {
    switch (command) {
      case 'test-connection':
        await testConnection();
        break;

      case 'get-offerings':
        await getOfferings();
        break;

      case 'get-products':
        await getProducts();
        break;

      case 'get-product':
        if (!args[0]) {
          console.error('❌ Product ID required');
          process.exit(1);
        }
        await getProduct(args[0]);
        break;

      case 'get-all-packages':
        await getAllPackages();
        break;

      case 'get-project-entitlements':
        await getProjectEntitlements();
        break;

      case 'get-customer':
        if (!args[0]) {
          console.error('❌ Email required');
          process.exit(1);
        }
        await getCustomer(args[0]);
        break;

      case 'create-customer':
        if (!args[0]) {
          console.error('❌ Email required');
          process.exit(1);
        }
        await createCustomer(args[0]);
        break;

      case 'get-subscriptions':
        if (!args[0]) {
          console.error('❌ Email required');
          process.exit(1);
        }
        await getSubscriptions(args[0]);
        break;

      case 'get-entitlements':
        if (!args[0]) {
          console.error('❌ Email required');
          process.exit(1);
        }
        await getEntitlements(args[0]);
        break;

      case 'check-active':
        if (!args[0]) {
          console.error('❌ Email required');
          process.exit(1);
        }
        await checkActive(args[0]);
        break;

      case 'get-package':
        if (!args[0] || !args[1]) {
          console.error('❌ Offering ID and Package ID required');
          process.exit(1);
        }
        await getPackage(args[0], args[1]);
        break;

      default:
        showUsage();
        break;
    }
  } catch (error: any) {
    console.error('💥 Test failed:', error?.message || error);
    process.exit(1);
  }
}

async function testConnection() {
  console.log('🔍 Testing RevenueCat API connection...');
  
  const isConnected = await revenueCatHandler.testConnection();
  
  if (isConnected) {
    console.log('✅ Connection successful!');
  } else {
    console.log('❌ Connection failed');
  }
}

async function getOfferings() {
  console.log('📦 Fetching RevenueCat offerings...');
  
  const offerings = await revenueCatHandler.getOfferings();
  
  console.log('\n=== RAW OFFERING DATA ===');
  console.log(JSON.stringify(offerings[0], null, 2));
  console.log('=========================\n');
  
  console.log(`Found ${offerings.length} offerings:`);
  offerings.forEach((offering, index) => {
    console.log(`\n${index + 1}. ID: ${offering.id}`);
    console.log(`   Display Name: ${offering.display_name}`);
    console.log(`   Lookup Key: ${offering.lookup_key}`);
    console.log(`   Current: ${offering.is_current}`);
    console.log(`   Packages: ${offering.packages?.length || 0}`);
    
    if (offering.packages) {
      offering.packages.forEach((pkg, pkgIndex) => {
        console.log(`     ${pkgIndex + 1}. ${pkg.identifier} (${pkg.platform_product_identifier})`);
      });
    }

    if (offering.metadata) {
      console.log(`   Metadata: ${JSON.stringify(offering.metadata)}`);
    }
  });
}

async function getProducts() {
  console.log('🛍️ Fetching RevenueCat products...');
  
  const products = await revenueCatHandler.getProducts();
  
  console.log(`Found ${products.length} products:`);
  console.log('\n=== RAW PRODUCT DATA ===');
  console.log(JSON.stringify(products[0], null, 2));
  console.log('========================\n');
  
  products.forEach((product, index) => {
    console.log(`\n${index + 1}. ID: ${product.id}`);
    console.log(`   Display Name: ${product.display_name}`);
    console.log(`   Store Identifier: ${product.store_identifier}`);
    console.log(`   Type: ${product.type}`);
    
    if (product.subscription) {
      console.log(`   Subscription Duration: ${product.subscription.duration || 'not set'}`);
      console.log(`   Trial Duration: ${product.subscription.trial_duration || 'not set'}`);
    }
    
    // Show all available properties
    console.log(`   All properties: ${Object.keys(product).join(', ')}`);
  });
}

async function getAllPackages() {
  console.log('📦 Fetching all RevenueCat packages...');
  
  const packages = await revenueCatHandler.getAllPackages();
  
  console.log(`Found ${packages.length} packages:`);
  packages.forEach((pkg, index) => {
    console.log(`\n${index + 1}. ${pkg.identifier}`);
    console.log(`   Platform Product ID: ${pkg.platform_product_identifier}`);
  });
}

async function getProjectEntitlements() {
  console.log('🎟️ Fetching project entitlements...');
  
  const entitlements = await revenueCatHandler.getProjectEntitlements();
  
  console.log(`Found ${entitlements.length} entitlements:`);
  entitlements.forEach((entitlement, index) => {
    console.log(`\n${index + 1}. ${JSON.stringify(entitlement, null, 2)}`);
  });
}

async function getProduct(productId: string) {
  console.log(`🛍️ Fetching product: ${productId}`);
  
  const product = await revenueCatHandler.getProduct(productId);
  
  if (product) {
    console.log('✅ Product found:');
    console.log(JSON.stringify(product, null, 2));
  } else {
    console.log('❌ Product not found');
  }
}

async function getCustomer(email: string) {
  console.log(`👤 Fetching customer: ${email}`);
  
  const customer = await revenueCatHandler.getCustomerByEmail(email);
  
  if (customer) {
    console.log('✅ Customer found:');
    console.log(`   App User ID: ${customer.app_user_id}`);
    console.log(`   Email: ${customer.email || 'Not set'}`);
    console.log(`   First Seen: ${customer.first_seen}`);
    console.log(`   Last Seen: ${customer.last_seen}`);
    console.log(`   Subscriptions: ${Object.keys(customer.subscriptions).length}`);
    console.log(`   Entitlements: ${Object.keys(customer.entitlements).length}`);
  } else {
    console.log('❌ Customer not found');
  }
}

async function createCustomer(email: string) {
  console.log(`👤 Creating customer: ${email}`);
  
  const customer = await revenueCatHandler.createOrUpdateCustomer(email);
  
  if (customer) {
    console.log('✅ Customer created/updated:');
    console.log(`   App User ID: ${customer.app_user_id}`);
    console.log(`   Email: ${customer.email}`);
  } else {
    console.log('ℹ️ Customer creation not supported via API - customers are created through purchases');
  }
}

async function getSubscriptions(email: string) {
  console.log(`📋 Fetching subscriptions for: ${email}`);
  
  const subscriptions = await revenueCatHandler.getCustomerSubscriptions(email);
  
  const subCount = Object.keys(subscriptions).length;
  console.log(`Found ${subCount} subscriptions:`);
  
  Object.entries(subscriptions).forEach(([productId, subscription]) => {
    console.log(`\n📱 ${productId}:`);
    console.log(`   Store: ${subscription.store}`);
    console.log(`   Expires: ${subscription.expires_date}`);
    console.log(`   Period: ${subscription.period_type}`);
    console.log(`   Sandbox: ${subscription.is_sandbox}`);
    
    const expiresDate = new Date(subscription.expires_date);
    const isActive = expiresDate > new Date();
    console.log(`   Status: ${isActive ? '✅ Active' : '❌ Expired'}`);
  });
}

async function getEntitlements(email: string) {
  console.log(`🎟️ Fetching entitlements for: ${email}`);
  
  const entitlements = await revenueCatHandler.getCustomerEntitlements(email);
  
  const entCount = Object.keys(entitlements).length;
  console.log(`Found ${entCount} entitlements:`);
  
  Object.entries(entitlements).forEach(([entitlementId, entitlement]) => {
    console.log(`\n🎫 ${entitlementId}:`);
    console.log(`   Product: ${entitlement.product_identifier}`);
    console.log(`   Purchase Date: ${entitlement.purchase_date}`);
    
    if (entitlement.expires_date) {
      const expiresDate = new Date(entitlement.expires_date);
      const isActive = expiresDate > new Date();
      console.log(`   Expires: ${entitlement.expires_date}`);
      console.log(`   Status: ${isActive ? '✅ Active' : '❌ Expired'}`);
    } else {
      console.log(`   Status: ✅ Lifetime`);
    }
  });
}

async function checkActive(email: string) {
  console.log(`🔍 Checking active subscription for: ${email}`);
  
  const hasActive = await revenueCatHandler.hasActiveSubscription(email);
  
  if (hasActive) {
    console.log('✅ Customer has active subscription');
  } else {
    console.log('❌ Customer has no active subscription');
  }
}

async function getPackage(offeringId: string, packageId: string) {
  console.log(`📦 Fetching package: ${offeringId}/${packageId}`);
  
  const pkg = await revenueCatHandler.getPackage(offeringId, packageId);
  
  if (pkg) {
    console.log('✅ Package found:');
    console.log(JSON.stringify(pkg, null, 2));
  } else {
    console.log('❌ Package not found');
  }
}

function showUsage() {
  console.log('Usage: tsx server/test-revenuecat.ts <command> [args...]');
  console.log('\nAvailable commands:');
  console.log('  test-connection                    - Test API connectivity');
  console.log('  get-offerings                      - Fetch all offerings');
  console.log('  get-products                       - Fetch all products');
  console.log('  get-product <productId>            - Get product details');
  console.log('  get-all-packages                   - Fetch all packages');
  console.log('  get-package <offeringId> <packageId> - Get specific package');
  console.log('  get-project-entitlements           - Fetch project entitlements');
  console.log('  get-customer <email>               - Get customer by email');
  console.log('  create-customer <email>            - Create new customer');
  console.log('  get-subscriptions <email>          - Get customer subscriptions');
  console.log('  get-entitlements <email>           - Get customer entitlements');
  console.log('  check-active <email>               - Check active subscription');
  console.log('\nExamples:');
  console.log('  tsx server/test-revenuecat.ts test-connection');
  console.log('  tsx server/test-revenuecat.ts get-offerings');
  console.log('  tsx server/test-revenuecat.ts get-products');
  console.log('  tsx server/test-revenuecat.ts get-customer user@example.com');
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Test script terminated');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});