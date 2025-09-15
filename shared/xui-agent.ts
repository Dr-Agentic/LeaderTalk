/**
 * XUI Agent - World-Class UI Developer
 * 
 * An intelligent UI/UX development agent that embodies industry best practices
 * for React (web) and React Native development. Specializes in:
 * 
 * - Design system architecture
 * - Theme system debugging
 * - CSS architecture optimization
 * - Accessibility compliance
 * - Cross-platform UI engineering
 * - Component development best practices
 */

export interface StyleGuideConfig {
  typography: {
    scale: number[];
    families: string[];
    lineHeights: Record<string, number>;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
    semantic: Record<string, string>;
  };
  spacing: {
    base: number;
    scale: number[];
  };
  accessibility: {
    contrastRatio: number;
    wcagLevel: 'AA' | 'AAA';
  };
}

export interface ComponentAuditResult {
  component: string;
  issues: {
    severity: 'critical' | 'warning' | 'suggestion';
    type: 'accessibility' | 'performance' | 'architecture' | 'design';
    message: string;
    fix?: string;
  }[];
  recommendations: string[];
}

export interface ThemeSystemStatus {
  tokensValid: boolean;
  themeToggleWorking: boolean;
  hardcodedColors: number;
  contrastIssues: string[];
  architectureScore: number;
}

export class XUIAgent {
  private guidelines: {
    mandatoryRules: string[];
    spacingSystem: number[];
    colorBalanceRule: { neutral: number; primary: number; accent: number };
    minContrastRatio: number;
    professionalApproach: string[];
  };

  constructor() {
    this.guidelines = {
      mandatoryRules: [
        "Always create style guide before UI changes",
        "Use design tokens, never hardcoded colors",
        "Maintain WCAG AA minimum contrast",
        "Follow 70/20/10 color balance",
        "Use 4pt base spacing system",
        "Implement both light and dark modes",
        "Never use setTimeout for DOM timing - use waitForElement pattern",
        "Separate component definition from instantiation",
        "Always ensure accessibility compliance"
      ],
      spacingSystem: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
      colorBalanceRule: { neutral: 70, primary: 20, accent: 10 },
      minContrastRatio: 4.5,
      professionalApproach: [
        "Root cause analysis before fixes",
        "Industry standard patterns over hacks",
        "Deterministic solutions over arbitrary timing",
        "Clean architecture over patches"
      ]
    };
  }

  /**
   * CRITICAL PRACTICE: Style Guide Creation
   * Creates comprehensive style guide before any UI changes
   */
  async createStyleGuide(config: StyleGuideConfig): Promise<string> {
    const styleGuideHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XUI Style Guide - Design System</title>
    <style>
        :root {
            /* Design Tokens - Colors */
            --color-primary: ${config.colors.primary};
            --color-secondary: ${config.colors.secondary};
            --color-accent: ${config.colors.accent};
            --color-neutral-50: ${config.colors.neutrals[0]};
            --color-neutral-100: ${config.colors.neutrals[1]};
            --color-neutral-900: ${config.colors.neutrals[8]};
            
            /* Typography Tokens */
            --font-size-h1: ${config.typography.scale[0]}px;
            --font-size-h2: ${config.typography.scale[1]}px;
            --font-size-body: ${config.typography.scale[4]}px;
            --font-size-caption: ${config.typography.scale[5]}px;
            
            /* Spacing Tokens */
            --spacing-xs: ${config.spacing.scale[0]}px;
            --spacing-sm: ${config.spacing.scale[1]}px;
            --spacing-md: ${config.spacing.scale[2]}px;
            --spacing-lg: ${config.spacing.scale[3]}px;
            --spacing-xl: ${config.spacing.scale[4]}px;
        }

        .dark {
            --color-primary: #60A5FA;
            --color-secondary: #34D399;
            --color-accent: #FBBF24;
            --color-neutral-50: #1F2937;
            --color-neutral-100: #374151;
            --color-neutral-900: #F9FAFB;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${config.typography.families[0]};
            background: var(--color-neutral-50);
            color: var(--color-neutral-900);
            line-height: 1.6;
            padding: var(--spacing-lg);
        }

        .style-guide-header {
            margin-bottom: var(--spacing-xl);
            text-align: center;
        }

        .theme-toggle {
            position: fixed;
            top: var(--spacing-md);
            right: var(--spacing-md);
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-primary);
            color: var(--color-neutral-50);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }

        .section {
            margin-bottom: var(--spacing-xl);
            padding: var(--spacing-lg);
            background: var(--color-neutral-100);
            border-radius: 12px;
        }

        .typography-scale h1 { font-size: var(--font-size-h1); margin-bottom: var(--spacing-sm); }
        .typography-scale h2 { font-size: var(--font-size-h2); margin-bottom: var(--spacing-sm); }
        .typography-scale p { font-size: var(--font-size-body); margin-bottom: var(--spacing-sm); }
        .typography-scale .caption { font-size: var(--font-size-caption); color: var(--color-neutral-900); opacity: 0.7; }

        .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--spacing-md);
        }

        .color-swatch {
            padding: var(--spacing-md);
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
        }

        .color-primary { background: var(--color-primary); color: var(--color-neutral-50); }
        .color-secondary { background: var(--color-secondary); color: var(--color-neutral-50); }
        .color-accent { background: var(--color-accent); color: var(--color-neutral-50); }

        .button {
            padding: var(--spacing-sm) var(--spacing-md);
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            margin: var(--spacing-xs);
            transition: all 0.2s ease;
        }

        .button-primary {
            background: var(--color-primary);
            color: var(--color-neutral-50);
        }

        .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .button-secondary {
            background: var(--color-secondary);
            color: var(--color-neutral-50);
        }

        .form-group {
            margin-bottom: var(--spacing-md);
        }

        .form-input {
            width: 100%;
            padding: var(--spacing-sm);
            border: 2px solid var(--color-neutral-100);
            border-radius: 8px;
            font-size: var(--font-size-body);
        }

        .form-input:focus {
            outline: none;
            border-color: var(--color-primary);
        }

        .card {
            background: var(--color-neutral-50);
            padding: var(--spacing-lg);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: var(--spacing-md);
        }

        .accessibility-info {
            background: var(--color-secondary);
            opacity: 0.1;
            padding: var(--spacing-md);
            border-radius: 8px;
            border-left: 4px solid var(--color-secondary);
        }
    </style>
</head>
<body>
    <button class="theme-toggle" onclick="toggleTheme()">🌓 Toggle Theme</button>
    
    <div class="style-guide-header">
        <h1>XUI Design System</h1>
        <p>Comprehensive style guide demonstrating industry best practices</p>
    </div>

    <div class="section">
        <h2>Typography Scale</h2>
        <div class="typography-scale">
            <h1>Header 1 - Primary Headlines</h1>
            <h2>Header 2 - Section Headers</h2>
            <p>Body text - Main content with optimal readability</p>
            <p class="caption">Caption text - Metadata and secondary information</p>
        </div>
    </div>

    <div class="section">
        <h2>Color System (70/20/10 Balance)</h2>
        <div class="color-grid">
            <div class="color-swatch color-primary">
                Primary (20%)
                <br>Brand & Actions
            </div>
            <div class="color-swatch color-secondary">
                Secondary
                <br>Success & Progress
            </div>
            <div class="color-swatch color-accent">
                Accent (10%)
                <br>Alerts & Attention
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Interactive Components</h2>
        <div>
            <button class="button button-primary">Primary Action</button>
            <button class="button button-secondary">Secondary Action</button>
        </div>
        
        <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" class="form-input" placeholder="Enter your email">
        </div>
    </div>

    <div class="section">
        <h2>Card Components</h2>
        <div class="card">
            <h3>Sample Card</h3>
            <p>Cards provide elevated content containers with consistent spacing and visual hierarchy.</p>
        </div>
    </div>

    <div class="section">
        <h2>Accessibility Compliance</h2>
        <div class="accessibility-info">
            <strong>WCAG ${config.accessibility.wcagLevel} Compliance:</strong>
            <ul>
                <li>✅ Contrast ratio ≥ ${config.accessibility.contrastRatio}:1</li>
                <li>✅ Focus indicators on all interactive elements</li>
                <li>✅ Semantic HTML structure</li>
                <li>✅ Alternative text for images</li>
                <li>✅ Keyboard navigation support</li>
            </ul>
        </div>
    </div>

    <script>
        function toggleTheme() {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');
            html.classList.toggle('dark', !isDark);
            
            // Update theme indicator
            console.log('Current theme:', isDark ? 'light' : 'dark');
        }

        // Industry standard: waitForElement pattern
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

        // Professional component initialization
        async function initializeStyleGuide() {
            const themeToggle = await waitForElement('.theme-toggle');
            console.log('Style guide initialized successfully');
        }

        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', initializeStyleGuide);
    </script>
</body>
</html>`;

    return styleGuideHTML;
  }

  /**
   * CSS Architecture Analysis - Detects hardcoded colors and violations
   */
  async analyzeCSSArchitecture(cssContent: string): Promise<{
    hardcodedColors: string[];
    violations: string[];
    recommendations: string[];
    architectureScore: number;
  }> {
    // Detect hardcoded colors but exclude legitimate token definitions
    const hardcodedColorRegex = /#[0-9A-Fa-f]{3,6}/g;
    const allColorMatches = cssContent.match(hardcodedColorRegex) || [];
    
    // Filter out colors that are inside CSS variable definitions (:root context)
    const hardcodedColors = allColorMatches.filter(color => {
      const colorIndex = cssContent.indexOf(color);
      const beforeColor = cssContent.substring(0, colorIndex);
      const afterLastSemicolon = beforeColor.lastIndexOf(';');
      const afterLastBrace = beforeColor.lastIndexOf('{');
      const currentContext = beforeColor.substring(Math.max(afterLastSemicolon, afterLastBrace));
      
      // Exclude if this color is part of a CSS variable definition
      return !currentContext.includes('--') || currentContext.includes(':') && !currentContext.includes('--');
    });
    
    const violations: string[] = [];
    const recommendations: string[] = [];

    if (hardcodedColors.length >= 5) {
      violations.push(`Found ${hardcodedColors.length} hardcoded colors - consider recreating CSS from scratch`);
      recommendations.push("Replace all hardcoded colors with design tokens like var(--color-primary)");
    }

    // Check for missing theme support (Tailwind dark mode)
    const hasDarkSupport = cssContent.includes('.dark') || cssContent.includes('dark:') || 
                          cssContent.includes('darkMode') || cssContent.includes('data-theme');
    if (!hasDarkSupport) {
      violations.push("Missing dark mode support - project uses Tailwind dark class");
      recommendations.push("Add .dark selector or dark: utility classes for theme support");
    }

    // Check for CSS variable usage (both custom and HSL tokens)
    const cssVariableUsage = (cssContent.match(/var\(--/g) || []).length;
    const hslTokenUsage = (cssContent.match(/hsl\(var\(--/g) || []).length;
    const totalColorProperties = (cssContent.match(/color:|background:|border-color:/g) || []).length;
    const totalVariableUsage = cssVariableUsage + hslTokenUsage;
    
    if (totalVariableUsage < totalColorProperties * 0.8) {
      violations.push("Low usage of CSS variables for colors");
      recommendations.push("Use semantic naming like --color-text-primary instead of --color-gray-900");
    }

    // Calculate architecture score
    let score = 100;
    score -= Math.min(hardcodedColors.length * 2, 40); // -2 points per hardcoded color, max -40
    score -= violations.length * 10; // -10 points per violation
    
    return {
      hardcodedColors,
      violations,
      recommendations,
      architectureScore: Math.max(score, 0)
    };
  }

  /**
   * Theme System Debugging - Comprehensive theme validation
   */
  async debugThemeSystem(cssContent: string, htmlContent?: string): Promise<ThemeSystemStatus> {
    const analysis = await this.analyzeCSSArchitecture(cssContent);
    
    const tokensValid = cssContent.includes(':root') && 
      (cssContent.includes('--color-') || cssContent.includes('--background') || 
       cssContent.includes('--primary') || cssContent.includes('--foreground'));
    const themeToggleWorking = htmlContent ? 
      (htmlContent.includes('dark') || htmlContent.includes('theme')) && htmlContent.includes('toggle') : false;
    
    // Check for contrast issues (simplified)
    const contrastIssues: string[] = [];
    if (analysis.hardcodedColors.length > 0) {
      contrastIssues.push("Hardcoded colors may cause contrast violations");
    }

    return {
      tokensValid,
      themeToggleWorking,
      hardcodedColors: analysis.hardcodedColors.length,
      contrastIssues,
      architectureScore: analysis.architectureScore
    };
  }

  /**
   * Component Development Assistant
   */
  generateReactComponent(name: string, type: 'button' | 'card' | 'form' | 'layout'): string {
    const baseImports = `import { cn } from "@/lib/utils";`;
    
    switch (type) {
      case 'button':
        return `${baseImports}
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

const ${name} = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles using design tokens
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          
          // Size variants
          {
            "px-3 py-2 text-sm": size === 'sm',
            "px-4 py-2.5 text-base": size === 'md', 
            "px-6 py-3 text-lg": size === 'lg',
          },
          
          // Color variants using semantic tokens
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary": variant === 'primary',
            "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary": variant === 'secondary',
            "bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent": variant === 'accent',
          },
          
          className
        )}
        data-testid="button-${name.toLowerCase()}"
        {...props}
      >
        {children}
      </button>
    );
  }
);

${name}.displayName = "${name}";

export { ${name} };`;

      case 'card':
        return `${baseImports}
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

const ${name} = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base card styles with design tokens
          "rounded-xl p-6 transition-all duration-200",
          
          // Variant styles
          {
            "bg-card text-card-foreground shadow-sm border": variant === 'default',
            "bg-card text-card-foreground shadow-lg border-0": variant === 'elevated',
            "bg-transparent border-2 border-border": variant === 'outlined',
          },
          
          className
        )}
        data-testid="card-${name.toLowerCase()}"
        {...props}
      >
        {children}
      </div>
    );
  }
);

${name}.displayName = "${name}";

export { ${name} };`;

      case 'form':
        return `${baseImports}
import { HTMLAttributes, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormProps extends HTMLAttributes<HTMLFormElement> {
  onSubmit?: (data: FormData) => void;
}

const ${name} = forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, children, ...props }, ref) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (onSubmit) {
        const formData = new FormData(e.currentTarget);
        onSubmit(formData);
      }
    };

    return (
      <form
        ref={ref}
        className={cn(
          "space-y-4 p-6 bg-card rounded-lg border",
          className
        )}
        onSubmit={handleSubmit}
        data-testid="form-${name.toLowerCase()}"
        {...props}
      >
        {children}
      </form>
    );
  }
);

${name}.displayName = "${name}";

export { ${name} };`;

      case 'layout':
        return `${baseImports}
import { HTMLAttributes, forwardRef } from "react";

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'container' | 'section' | 'grid';
}

const ${name} = forwardRef<HTMLDivElement, LayoutProps>(
  ({ className, variant = 'container', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base layout styles
          "w-full",
          
          // Variant styles
          {
            "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8": variant === 'container',
            "py-12 lg:py-16": variant === 'section',
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6": variant === 'grid',
          },
          
          className
        )}
        data-testid="layout-${name.toLowerCase()}"
        {...props}
      >
        {children}
      </div>
    );
  }
);

${name}.displayName = "${name}";

export { ${name} };`;

      default:
        return `// XUI Agent: Component type '${type}' not implemented yet`;
    }
  }

  /**
   * React Native Component Generator
   */
  generateReactNativeComponent(name: string, type: 'button' | 'card' | 'text'): string {
    const baseImports = `import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';`;

    switch (type) {
      case 'button':
        return `${baseImports}

interface ${name}Props {
  title: string;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}

export function ${name}({ 
  title, 
  variant = 'primary', 
  size = 'md',
  onPress, 
  disabled = false,
  testID = '${name.toLowerCase()}'
}: ${name}Props) {
  const backgroundColor = useThemeColor(
    { light: '#3B82F6', dark: '#60A5FA' },
    'primary'
  );
  
  const textColor = useThemeColor(
    { light: '#FFFFFF', dark: '#FFFFFF' },
    'primaryForeground'
  );

  const styles = StyleSheet.create({
    button: {
      backgroundColor: disabled ? '#9CA3AF' : backgroundColor,
      paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
      paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44, // Accessibility: minimum touch target
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    text: {
      color: textColor,
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}`;

      case 'card':
        return `${baseImports}

interface ${name}Props {
  title?: string;
  children?: React.ReactNode;
  style?: any;
  testID?: string;
}

export function ${name}({ 
  title, 
  children, 
  style,
  testID = '${name.toLowerCase()}'
}: ${name}Props) {
  const backgroundColor = useThemeColor(
    { light: '#FFFFFF', dark: '#1F2937' },
    'card'
  );
  
  const textColor = useThemeColor(
    { light: '#111827', dark: '#F9FAFB' },
    'text'
  );

  const styles = StyleSheet.create({
    card: {
      backgroundColor,
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginBottom: title ? 8 : 0,
    },
  });

  return (
    <View style={[styles.card, style]} testID={testID}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}`;

      case 'text':
        return `import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ${name}Props extends TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'caption';
  color?: string;
}

export function ${name}({ 
  variant = 'body',
  color,
  style,
  children,
  ...props
}: ${name}Props) {
  const themeColor = useThemeColor(
    { light: '#111827', dark: '#F9FAFB' },
    'text'
  );

  const styles = StyleSheet.create({
    h1: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
      color: color || themeColor,
    },
    h2: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 28,
      color: color || themeColor,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: color || themeColor,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: color || themeColor,
    },
  });

  return (
    <RNText 
      style={[styles[variant], style]} 
      {...props}
    >
      {children}
    </RNText>
  );
}`;

      default:
        return `// XUI Agent: React Native component type '${type}' not implemented yet`;
    }
  }

  /**
   * Accessibility Audit
   */
  auditAccessibility(componentCode: string): ComponentAuditResult {
    const issues: ComponentAuditResult['issues'] = [];
    const recommendations: string[] = [];

    // Check for data-testid attributes
    if (!componentCode.includes('data-testid') && !componentCode.includes('testID')) {
      issues.push({
        severity: 'warning',
        type: 'accessibility',
        message: 'Missing test identifiers for UI testing',
        fix: 'Add data-testid or testID props for testing'
      });
    }

    // Check for accessibility props in React Native
    if (componentCode.includes('TouchableOpacity') || componentCode.includes('Pressable')) {
      if (!componentCode.includes('accessibilityRole')) {
        issues.push({
          severity: 'critical',
          type: 'accessibility',
          message: 'Missing accessibilityRole for touchable component',
          fix: 'Add accessibilityRole prop'
        });
      }
    }

    // Check for minimum touch target size
    if (componentCode.includes('React Native') && !componentCode.includes('minHeight: 44')) {
      issues.push({
        severity: 'warning',
        type: 'accessibility',
        message: 'Touch target may be too small (minimum 44pt required)',
        fix: 'Ensure minHeight: 44 or larger'
      });
    }

    // Check for hardcoded colors
    const hardcodedColors = componentCode.match(/#[0-9A-Fa-f]{3,6}/g);
    if (hardcodedColors && hardcodedColors.length > 0) {
      issues.push({
        severity: 'critical',
        type: 'architecture',
        message: `Found ${hardcodedColors.length} hardcoded colors`,
        fix: 'Replace with design tokens or theme variables'
      });
    }

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push("Component follows XUI best practices");
    } else {
      recommendations.push("Fix critical accessibility and architecture issues");
      recommendations.push("Ensure WCAG AA compliance");
      recommendations.push("Use design tokens consistently");
    }

    return {
      component: 'Unknown', // Would be parsed from code
      issues,
      recommendations
    };
  }

  /**
   * Professional DOM Element Waiting (Industry Standard)
   */
  generateWaitForElementPattern(): string {
    return `
// XUI Agent: Industry Standard DOM Element Waiting
// NEVER use setTimeout for DOM timing - use this pattern instead

const waitForElement = (selector: string): Promise<Element> => {
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

// Usage example:
async function initializeComponent() {
  const trigger = await waitForElement('#userMenuTrigger');
  const dropdown = await waitForElement('#userDropdown');
  
  // Now safely attach event listeners
  trigger.addEventListener('click', () => toggleDropdown());
}

// This pattern is:
// ✅ Used by all major frameworks (React, Vue, Angular)
// ✅ Browser-optimized (requestAnimationFrame syncs with paint cycles)
// ✅ Deterministic (guarantees element exists)
// ✅ Performance-aware (~16ms intervals, doesn't block main thread)
// ✅ Reliable across all devices and network conditions
`;
  }

  /**
   * Generate professional CSS architecture
   */
  generateCSSArchitecture(): string {
    return `
/* XUI Agent: Professional CSS Architecture */

/* 1. Design Tokens - Define all colors as CSS variables first */
:root {
  /* Semantic Color Tokens (NOT --color-gray-900) */
  --color-text-primary: hsl(222, 84%, 5%);
  --color-text-secondary: hsl(215, 16%, 47%);
  --color-surface: hsl(0, 0%, 100%);
  --color-surface-elevated: hsl(210, 40%, 98%);
  --color-border: hsl(214, 32%, 91%);
  --color-primary: hsl(221, 83%, 53%);
  --color-primary-foreground: hsl(210, 40%, 98%);
  --color-secondary: hsl(210, 40%, 96%);
  --color-accent: hsl(221, 83%, 53%);
  
  /* Spacing Tokens - 4pt base system */
  --spacing-xs: 0.25rem;  /* 4px */
  --spacing-sm: 0.5rem;   /* 8px */
  --spacing-md: 0.75rem;  /* 12px */
  --spacing-lg: 1rem;     /* 16px */
  --spacing-xl: 1.25rem;  /* 20px */
  --spacing-2xl: 1.5rem;  /* 24px */
  --spacing-3xl: 2rem;    /* 32px */
  --spacing-4xl: 2.5rem;  /* 40px */
  --spacing-5xl: 3rem;    /* 48px */
  --spacing-6xl: 4rem;    /* 64px */
}

/* 2. Explicit Theme Overrides */
[data-theme="light"] {
  --color-text-primary: hsl(222, 84%, 5%);
  --color-surface: hsl(0, 0%, 100%);
  --color-border: hsl(214, 32%, 91%);
}

[data-theme="dark"] {
  --color-text-primary: hsl(210, 40%, 98%);
  --color-surface: hsl(222, 84%, 5%);
  --color-border: hsl(215, 16%, 19%);
}

/* 3. Component Architecture - Using tokens only */
.button {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border: 1px solid var(--color-border);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.15);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: var(--spacing-2xl);
  box-shadow: 0 1px 3px hsla(0, 0%, 0%, 0.1);
}

/* 4. Typography Scale */
.text-h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
.text-h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
.text-body { font-size: 1rem; font-weight: 400; line-height: 1.6; }
.text-caption { font-size: 0.875rem; font-weight: 400; line-height: 1.4; }

/* 5. Layout Utilities */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* XUI Architecture Benefits:
✅ Zero hardcoded colors - all use design tokens
✅ Explicit theme support for light/dark modes
✅ Semantic naming for maintainability
✅ Consistent spacing scale
✅ High specificity to override component library conflicts
✅ Professional architecture that scales
*/
`;
  }

  /**
   * Get XUI Agent Guidelines Summary
   */
  getGuidelines(): {
    mandatoryRules: string[];
    professionalApproach: string[];
    architectureRules: string[];
    quickFixRedFlags: string[];
  } {
    return {
      mandatoryRules: this.guidelines.mandatoryRules,
      professionalApproach: this.guidelines.professionalApproach,
      architectureRules: [
        "Design tokens first - define all colors as CSS variables before writing components",
        "Explicit theme overrides - use [data-theme=\"light\"] and [data-theme=\"dark\"] selectors",
        "No hardcoded colors - use linting patterns to detect violations",
        "Semantic naming - --color-text-primary not --color-gray-900",
        "Clean architecture - recreate from scratch if >50 hardcoded colors found"
      ],
      quickFixRedFlags: [
        "Using setTimeout for DOM timing",
        "Magic numbers without explanation",
        "\"It works on my machine\" solutions",
        "Adding delays instead of fixing root causes",
        "Hardcoded colors in components",
        "Missing accessibility attributes"
      ]
    };
  }
}

// Export singleton instance
export const xuiAgent = new XUIAgent();