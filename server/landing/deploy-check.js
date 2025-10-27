#!/usr/bin/env node

/**
 * LeaderTalk Landing Page Deployment Checker
 * 
 * This script verifies that the landing page is properly configured
 * and ready for deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 LeaderTalk Landing Page Deployment Checker\n');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, message) {
  const status = condition ? '✅' : '❌';
  const result = { name, passed: condition, message };
  checks.push(result);
  
  if (condition) {
    passed++;
    console.log(`${status} ${name}`);
  } else {
    failed++;
    console.log(`${status} ${name}: ${message}`);
  }
}

// File existence checks
const landingDir = __dirname;
const requiredFiles = [
  'index.html',
  'styles.css',
  'script.js',
  'README.md'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(landingDir, file);
  check(
    `${file} exists`,
    fs.existsSync(filePath),
    `File not found: ${filePath}`
  );
});

// Directory structure checks
console.log('\n📂 Checking directory structure...');
const assetsDir = path.join(landingDir, 'assets', 'images');
check(
  'Assets directory exists',
  fs.existsSync(assetsDir),
  'Create assets/images directory for landing page images'
);

// Content validation checks
console.log('\n📄 Checking file contents...');

// Check HTML file
const htmlPath = path.join(landingDir, 'index.html');
if (fs.existsSync(htmlPath)) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  check(
    'HTML has proper DOCTYPE',
    htmlContent.includes('<!DOCTYPE html>'),
    'HTML file should start with <!DOCTYPE html>'
  );
  
  check(
    'HTML has meta viewport',
    htmlContent.includes('name="viewport"'),
    'Add viewport meta tag for mobile responsiveness'
  );
  
  check(
    'HTML has title tag',
    htmlContent.includes('<title>') && htmlContent.includes('LeaderTalk'),
    'Add proper title tag with LeaderTalk branding'
  );
  
  check(
    'HTML has meta description',
    htmlContent.includes('name="description"'),
    'Add meta description for SEO'
  );
  
  check(
    'HTML links to CSS',
    htmlContent.includes('styles.css'),
    'Link to styles.css file'
  );
  
  check(
    'HTML links to JavaScript',
    htmlContent.includes('script.js'),
    'Link to script.js file'
  );
  
  check(
    'HTML has CTA buttons',
    htmlContent.includes('app.leadertalk.app'),
    'Add CTA buttons linking to app.leadertalk.app'
  );
}

// Check CSS file
const cssPath = path.join(landingDir, 'styles.css');
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  check(
    'CSS has design tokens',
    cssContent.includes(':root') && cssContent.includes('--color-'),
    'CSS should include design token variables'
  );
  
  check(
    'CSS has responsive design',
    cssContent.includes('@media'),
    'CSS should include responsive media queries'
  );
  
  check(
    'CSS has glass morphism',
    cssContent.includes('backdrop-filter'),
    'CSS should include glass morphism effects'
  );
}

// Check JavaScript file
const jsPath = path.join(landingDir, 'script.js');
if (fs.existsSync(jsPath)) {
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  
  check(
    'JavaScript has DOM ready handler',
    jsContent.includes('DOMContentLoaded'),
    'JavaScript should wait for DOM to be ready'
  );
  
  check(
    'JavaScript has contact form handler',
    jsContent.includes('contactForm') || jsContent.includes('contact-form'),
    'JavaScript should handle contact form submission'
  );
  
  check(
    'JavaScript has testimonial slider',
    jsContent.includes('testimonial') || jsContent.includes('slider'),
    'JavaScript should handle testimonial slider'
  );
}

// Route configuration check
console.log('\n🛣️  Checking route configuration...');
const routesPath = path.join(__dirname, '..', 'routes', 'landing.ts');
check(
  'Landing route file exists',
  fs.existsSync(routesPath),
  'Create landing.ts route file in server/routes/'
);

const indexRoutesPath = path.join(__dirname, '..', 'routes', 'index.ts');
if (fs.existsSync(indexRoutesPath)) {
  const routesContent = fs.readFileSync(indexRoutesPath, 'utf8');
  check(
    'Landing routes registered',
    routesContent.includes('landing'),
    'Register landing routes in routes/index.ts'
  );
}

// Asset recommendations
console.log('\n🖼️  Checking recommended assets...');
const faviconPath = path.join(assetsDir, 'favicon.png');
const ogImagePath = path.join(assetsDir, 'og-image.png');

check(
  'Favicon exists',
  fs.existsSync(faviconPath),
  'Add favicon.png (32x32) to assets/images/'
);

check(
  'Open Graph image exists',
  fs.existsSync(ogImagePath),
  'Add og-image.png (1200x630) to assets/images/'
);

// Performance recommendations
console.log('\n⚡ Performance recommendations...');
if (fs.existsSync(cssPath)) {
  const cssStats = fs.statSync(cssPath);
  const cssSize = cssStats.size;
  
  check(
    'CSS file size reasonable',
    cssSize < 100000, // 100KB
    `CSS file is ${Math.round(cssSize/1024)}KB, consider optimization if >100KB`
  );
}

if (fs.existsSync(jsPath)) {
  const jsStats = fs.statSync(jsPath);
  const jsSize = jsStats.size;
  
  check(
    'JavaScript file size reasonable',
    jsSize < 50000, // 50KB
    `JavaScript file is ${Math.round(jsSize/1024)}KB, consider optimization if >50KB`
  );
}

// Summary
console.log('\n📊 Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📋 Total checks: ${checks.length}`);

const successRate = Math.round((passed / checks.length) * 100);
console.log(`🎯 Success rate: ${successRate}%`);

if (failed === 0) {
  console.log('\n🎉 All checks passed! Landing page is ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Add favicon.png and og-image.png to assets/images/');
  console.log('2. Update Google Analytics ID in index.html');
  console.log('3. Configure DNS to point leadertalk.app to your server');
  console.log('4. Deploy and test in production');
} else {
  console.log(`\n⚠️  ${failed} issues need to be resolved before deployment.`);
  console.log('\nFailed checks:');
  checks.filter(c => !c.passed).forEach(c => {
    console.log(`- ${c.name}: ${c.message}`);
  });
}

console.log('\n📚 For detailed deployment instructions, see README.md');
console.log('💡 For optimization tips, see optimize.md');

process.exit(failed > 0 ? 1 : 0);
