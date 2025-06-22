#!/usr/bin/env node

/**
 * CSS Architecture Audit Script
 * Systematically identifies and reports all CSS conflicts in the codebase
 */

const fs = require('fs');
const path = require('path');

// Define problematic patterns and their semantic replacements
const CSS_MIGRATIONS = {
  // Text color migrations
  'text-foreground': 'card-description',
  'text-muted-foreground': 'card-description', 
  'text-white': 'card-title',
  'text-gray-300': 'card-description',
  'text-gray-400': 'card-description',
  'text-gray-500': 'card-description',
  'text-gray-600': 'card-description',
  'text-gray-700': 'card-description',
  
  // Background migrations
  'bg-white': 'glass-card',
  'bg-gray-50': 'glass-card',
  'bg-gray-100': 'glass-card',
  
  // Layout migrations
  'flex items-center justify-between': 'flex-between',
  'flex flex-col': 'flex-column',
  'grid grid-cols-1 md:grid-cols-2': 'responsive-grid-2',
  'grid grid-cols-1 md:grid-cols-3': 'responsive-grid',
  'space-y-6': 'space-y-lg',
  'space-y-4': 'space-y-md',
  'space-y-2': 'space-y-sm'
};

// Patterns that should be flagged as problematic
const PROBLEMATIC_PATTERNS = [
  /text-(foreground|muted-foreground)/g,
  /text-gray-[0-9]+/g,
  /bg-gray-[0-9]+/g,
  /text-white(?=\s|")/g, // Only when used for text color, not in combinations
];

class CSSAuditor {
  constructor() {
    this.issues = [];
    this.filesScanned = 0;
    this.issuesFound = 0;
  }

  scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        this.scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        this.scanFile(filePath);
      }
    }
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    this.filesScanned++;
    
    // Check for problematic patterns
    for (const pattern of PROBLEMATIC_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lines = content.split('\n');
          const lineNumber = this.findLineNumber(content, match);
          
          this.issues.push({
            file: filePath.replace(process.cwd() + '/', ''),
            line: lineNumber,
            issue: match,
            recommendation: CSS_MIGRATIONS[match] || 'Use semantic class',
            type: this.categorizeIssue(match)
          });
          this.issuesFound++;
        });
      }
    }
  }

  findLineNumber(content, searchText) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return 1;
  }

  categorizeIssue(issue) {
    if (issue.includes('text-')) return 'text-color';
    if (issue.includes('bg-')) return 'background';
    if (issue.includes('flex') || issue.includes('grid')) return 'layout';
    return 'other';
  }

  generateReport() {
    console.log('\n🔍 CSS Architecture Audit Report');
    console.log('================================');
    console.log(`Files scanned: ${this.filesScanned}`);
    console.log(`Issues found: ${this.issuesFound}`);
    
    if (this.issues.length === 0) {
      console.log('✅ No CSS architecture violations found!');
      return;
    }

    // Group issues by type
    const byType = this.issues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, issues]) => {
      console.log(`\n📋 ${type.toUpperCase()} Issues (${issues.length}):`);
      issues.forEach(issue => {
        console.log(`  ❌ ${issue.file}:${issue.line} - "${issue.issue}"`);
        console.log(`     ✅ Replace with: "${issue.recommendation}"`);
      });
    });

    // Generate migration script
    this.generateMigrationScript();
  }

  generateMigrationScript() {
    console.log('\n🔧 Auto-Migration Script:');
    console.log('=========================');
    
    const migrations = new Set();
    this.issues.forEach(issue => {
      const replacement = CSS_MIGRATIONS[issue.issue];
      if (replacement) {
        migrations.add(`sed -i 's/${issue.issue}/${replacement}/g' ${issue.file}`);
      }
    });

    migrations.forEach(cmd => console.log(cmd));
  }

  // Additional diagnostic methods
  validateCSSVariables() {
    const tokensPath = 'client/src/styles/tokens.css';
    if (!fs.existsSync(tokensPath)) {
      console.log('❌ tokens.css not found');
      return;
    }

    const tokensContent = fs.readFileSync(tokensPath, 'utf8');
    const requiredVariables = [
      '--gradient-background',
      '--color-text-primary', 
      '--color-text-secondary',
      '--glass-bg',
      '--foreground',
      '--muted-foreground'
    ];

    console.log('\n🎨 CSS Variables Validation:');
    requiredVariables.forEach(variable => {
      const exists = tokensContent.includes(variable);
      console.log(`  ${exists ? '✅' : '❌'} ${variable}`);
    });
  }

  checkCSSImportOrder() {
    const indexCssPath = 'client/src/index.css';
    if (!fs.existsSync(indexCssPath)) {
      console.log('❌ index.css not found');
      return;
    }

    const content = fs.readFileSync(indexCssPath, 'utf8');
    const expectedOrder = [
      'tokens.css',
      'base.css', 
      'themes.css',
      'layout.css',
      '@tailwind base',
      '@tailwind components',
      '@tailwind utilities'
    ];

    console.log('\n📦 CSS Import Order Validation:');
    let currentPosition = 0;
    expectedOrder.forEach(importItem => {
      const position = content.indexOf(importItem);
      const isCorrectOrder = position > currentPosition;
      console.log(`  ${isCorrectOrder ? '✅' : '❌'} ${importItem}`);
      currentPosition = position;
    });
  }
}

// Run the audit
const auditor = new CSSAuditor();

console.log('🚀 Starting CSS Architecture Audit...');
auditor.scanDirectory('client/src');
auditor.generateReport();
auditor.validateCSSVariables();
auditor.checkCSSImportOrder();

console.log('\n💡 Next Steps:');
console.log('1. Run the migration commands above');
console.log('2. Test pages visually for background/text issues');
console.log('3. Check browser console for CSS warnings');
console.log('4. Validate with: window.cssDebugger.auditPage("main")');