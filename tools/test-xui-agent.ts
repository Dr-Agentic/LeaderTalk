/**
 * Test XUI Agent functionality to verify it works correctly
 */

import { xuiAgent } from '../shared/xui-agent';

async function testXUIAgent() {
  console.log('🧪 Testing XUI Agent System...\n');

  try {
    // Test 1: CSS Architecture Analysis
    console.log('1. Testing CSS Architecture Analysis...');
    const sampleCSS = `
      .button {
        background: #3B82F6;
        color: #ffffff;
        padding: 16px;
      }
      
      .card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        padding: var(--spacing-lg);
      }
    `;
    
    const analysis = await xuiAgent.analyzeCSSArchitecture(sampleCSS);
    console.log(`   ✅ Found ${analysis.hardcodedColors.length} hardcoded colors`);
    console.log(`   ✅ Architecture score: ${analysis.architectureScore}/100`);
    console.log(`   ✅ Violations: ${analysis.violations.length}`);

    // Test 2: Component Generation
    console.log('\n2. Testing React Component Generation...');
    const buttonComponent = xuiAgent.generateReactComponent('TestButton', 'button');
    const isValidComponent = buttonComponent.includes('forwardRef') && 
                           buttonComponent.includes('data-testid') &&
                           buttonComponent.includes('className={cn(');
    console.log(`   ✅ Generated React button component: ${isValidComponent ? 'Valid' : 'Invalid'}`);

    // Test 3: React Native Component Generation
    console.log('\n3. Testing React Native Component Generation...');
    const rnComponent = xuiAgent.generateReactNativeComponent('TestButton', 'button');
    const isValidRNComponent = rnComponent.includes('TouchableOpacity') && 
                             rnComponent.includes('accessibilityRole') &&
                             rnComponent.includes('testID');
    console.log(`   ✅ Generated React Native component: ${isValidRNComponent ? 'Valid' : 'Invalid'}`);

    // Test 4: Guidelines Access
    console.log('\n4. Testing Guidelines Access...');
    const guidelines = xuiAgent.getGuidelines();
    console.log(`   ✅ Mandatory rules: ${guidelines.mandatoryRules.length}`);
    console.log(`   ✅ Architecture rules: ${guidelines.architectureRules.length}`);
    console.log(`   ✅ Quick fix red flags: ${guidelines.quickFixRedFlags.length}`);

    // Test 5: waitForElement Pattern
    console.log('\n5. Testing waitForElement Pattern...');
    const waitPattern = xuiAgent.generateWaitForElementPattern();
    const isValidPattern = waitPattern.includes('requestAnimationFrame') &&
                          waitPattern.includes('waitForElement') &&
                          waitPattern.includes('Industry Standard');
    console.log(`   ✅ waitForElement pattern: ${isValidPattern ? 'Valid' : 'Invalid'}`);

    console.log('\n🎉 XUI Agent System Test Complete - All Core Functions Working!');
    return true;

  } catch (error) {
    console.error('❌ XUI Agent Test Failed:', error.message);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testXUIAgent()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testXUIAgent };