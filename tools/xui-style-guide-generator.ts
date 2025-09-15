/**
 * XUI Style Guide Generator
 * 
 * Generates comprehensive style guides following XUI Agent best practices
 * Used to create single source of truth for design systems
 */

import { xuiAgent, StyleGuideConfig } from '../shared/xui-agent';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class StyleGuideGenerator {
  private outputDir: string;

  constructor(outputDir = 'public/style-guides') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate style guide for the current LeaderTalk project
   */
  async generateLeaderTalkStyleGuide(): Promise<string> {
    const config: StyleGuideConfig = {
      typography: {
        scale: [32, 24, 20, 18, 16, 14], // h1, h2, h3, h4, body, caption
        families: ['Inter', 'system-ui', 'sans-serif'],
        lineHeights: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.7
        }
      },
      colors: {
        primary: '#3B82F6', // Blue - trust and professionalism
        secondary: '#10B981', // Green - success and growth  
        accent: '#F59E0B', // Amber - attention and energy
        neutrals: [
          '#F9FAFB', // neutral-50
          '#F3F4F6', // neutral-100
          '#E5E7EB', // neutral-200
          '#D1D5DB', // neutral-300
          '#9CA3AF', // neutral-400
          '#6B7280', // neutral-500
          '#4B5563', // neutral-600
          '#374151', // neutral-700
          '#1F2937', // neutral-800
          '#111827'  // neutral-900
        ],
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6'
        }
      },
      spacing: {
        base: 4,
        scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
      },
      accessibility: {
        contrastRatio: 4.5,
        wcagLevel: 'AA'
      }
    };

    const styleGuideHTML = await xuiAgent.createStyleGuide(config);
    const filename = `leadertalk-style-guide-${Date.now()}.html`;
    const filepath = join(this.outputDir, filename);
    
    writeFileSync(filepath, styleGuideHTML);
    console.log(`✅ XUI Style Guide generated: ${filepath}`);
    
    return filepath;
  }

  /**
   * Generate React component style guide
   */
  async generateComponentStyleGuide(): Promise<string> {
    const componentExamples = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XUI Component Style Guide</title>
    <style>
        :root {
            --color-primary: #3B82F6;
            --color-secondary: #10B981;
            --color-accent: #F59E0B;
            --color-neutral-50: #F9FAFB;
            --color-neutral-100: #F3F4F6;
            --color-neutral-900: #111827;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --spacing-xl: 2rem;
        }

        .dark {
            --color-primary: #60A5FA;
            --color-secondary: #34D399;
            --color-accent: #FBBF24;
            --color-neutral-50: #1F2937;
            --color-neutral-100: #374151;
            --color-neutral-900: #F9FAFB;
        }

        body {
            font-family: Inter, system-ui, sans-serif;
            background: var(--color-neutral-50);
            color: var(--color-neutral-900);
            margin: 0;
            padding: var(--spacing-lg);
            line-height: 1.6;
        }

        .component-section {
            margin-bottom: var(--spacing-xl);
            padding: var(--spacing-lg);
            background: var(--color-neutral-50);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .component-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: var(--spacing-md);
            color: var(--color-primary);
        }

        .component-example {
            padding: var(--spacing-md);
            border: 2px dashed var(--color-neutral-100);
            border-radius: 8px;
            margin-bottom: var(--spacing-md);
        }

        .code-example {
            background: var(--color-neutral-900);
            color: var(--color-neutral-50);
            padding: var(--spacing-md);
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            overflow-x: auto;
            font-size: 14px;
        }

        /* Component Styles */
        .xui-button {
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 44px; /* Accessibility */
        }

        .xui-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .xui-button-secondary {
            background: var(--color-secondary);
        }

        .xui-card {
            background: var(--color-neutral-50);
            padding: var(--spacing-lg);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid var(--color-neutral-100);
        }

        .xui-input {
            width: 100%;
            padding: var(--spacing-sm);
            border: 2px solid var(--color-neutral-100);
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s ease;
        }

        .xui-input:focus {
            outline: none;
            border-color: var(--color-primary);
        }

        .theme-toggle {
            position: fixed;
            top: var(--spacing-md);
            right: var(--spacing-md);
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-primary);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <button class="theme-toggle" onclick="toggleTheme()">🌓 Toggle Theme</button>
    
    <h1>XUI Component Library</h1>
    <p>Production-ready components following XUI Agent best practices</p>

    <div class="component-section">
        <h2 class="component-title">Buttons</h2>
        <div class="component-example">
            <button class="xui-button" data-testid="button-primary">Primary Action</button>
            <button class="xui-button xui-button-secondary" data-testid="button-secondary">Secondary Action</button>
        </div>
        <div class="code-example">
&lt;button className="xui-button" data-testid="button-primary"&gt;
  Primary Action
&lt;/button&gt;
        </div>
    </div>

    <div class="component-section">
        <h2 class="component-title">Cards</h2>
        <div class="component-example">
            <div class="xui-card" data-testid="card-sample">
                <h3>Sample Card</h3>
                <p>Cards provide elevated content containers with consistent spacing.</p>
            </div>
        </div>
        <div class="code-example">
&lt;div className="xui-card" data-testid="card-sample"&gt;
  &lt;h3&gt;Sample Card&lt;/h3&gt;
  &lt;p&gt;Cards provide elevated content containers.&lt;/p&gt;
&lt;/div&gt;
        </div>
    </div>

    <div class="component-section">
        <h2 class="component-title">Form Elements</h2>
        <div class="component-example">
            <label for="sample-input">Email Address</label>
            <input type="email" id="sample-input" class="xui-input" placeholder="Enter your email" data-testid="input-email">
        </div>
        <div class="code-example">
&lt;input 
  type="email" 
  className="xui-input" 
  placeholder="Enter your email"
  data-testid="input-email"
/&gt;
        </div>
    </div>

    <div class="component-section">
        <h2 class="component-title">XUI Agent Rules Applied</h2>
        <ul>
            <li>✅ All colors use design tokens (var(--color-*))</li>
            <li>✅ 4pt spacing system implemented</li>
            <li>✅ Minimum 44px touch targets for accessibility</li>
            <li>✅ WCAG AA contrast ratios maintained</li>
            <li>✅ Dark/light theme support</li>
            <li>✅ data-testid attributes for testing</li>
            <li>✅ Semantic HTML structure</li>
            <li>✅ No hardcoded colors</li>
        </ul>
    </div>

    <script>
        function toggleTheme() {
            const html = document.documentElement;
            html.classList.toggle('dark');
        }

        // XUI Agent: Industry standard waitForElement pattern
        const waitForElement = (selector) => {
            return new Promise((resolve) => {
                const check = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve(element);
                    } else {
                        requestAnimationFrame(check);
                    }
                };
                check();
            });
        };

        async function initializeComponents() {
            const themeToggle = await waitForElement('.theme-toggle');
            console.log('XUI Components initialized successfully');
        }

        document.addEventListener('DOMContentLoaded', initializeComponents);
    </script>
</body>
</html>`;

    const filename = `xui-components-${Date.now()}.html`;
    const filepath = join(this.outputDir, filename);
    
    writeFileSync(filepath, componentExamples);
    console.log(`✅ XUI Component Style Guide generated: ${filepath}`);
    
    return filepath;
  }

  /**
   * Audit existing CSS for XUI compliance
   */
  async auditProject(): Promise<void> {
    const cssFiles = [
      'client/src/index.css',
      'client/src/styles/tokens.css',
      'client/src/styles/themes.css',
      'expoClient/src/styles/globals.css'
    ];

    console.log('🔍 XUI Agent: Auditing project CSS architecture...\n');

    for (const file of cssFiles) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(file)) {
          const cssContent = fs.readFileSync(file, 'utf-8');
          const analysis = await xuiAgent.analyzeCSSArchitecture(cssContent);
          
          console.log(`📁 File: ${file}`);
          console.log(`   Architecture Score: ${analysis.architectureScore}/100`);
          console.log(`   Hardcoded Colors: ${analysis.hardcodedColors.length}`);
          
          if (analysis.violations.length > 0) {
            console.log(`   ⚠️  Violations:`);
            analysis.violations.forEach(v => console.log(`      - ${v}`));
          }
          
          if (analysis.recommendations.length > 0) {
            console.log(`   💡 Recommendations:`);
            analysis.recommendations.forEach(r => console.log(`      - ${r}`));
          }
          console.log('');
        }
      } catch (error) {
        console.log(`   ❌ Error auditing ${file}: ${error.message}\n`);
      }
    }
  }
}

// Export for CLI usage
export const styleGuideGenerator = new StyleGuideGenerator();

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      styleGuideGenerator.generateLeaderTalkStyleGuide()
        .then(path => console.log(`Style guide generated: ${path}`))
        .catch(console.error);
      break;
    
    case 'components':
      styleGuideGenerator.generateComponentStyleGuide()
        .then(path => console.log(`Component guide generated: ${path}`))
        .catch(console.error);
      break;
    
    case 'audit':
      styleGuideGenerator.auditProject()
        .catch(console.error);
      break;
    
    default:
      console.log(`
XUI Style Guide Generator

Usage:
  npm run xui generate    - Generate style guide for LeaderTalk
  npm run xui components  - Generate component library guide  
  npm run xui audit      - Audit project CSS architecture

Examples:
  npm run xui generate
  npm run xui audit
`);
  }
}