/**
 * CSS Architecture Debugging Utility
 * Provides deterministic methods to identify and fix styling issues
 */

export interface CSSConflict {
  element: string;
  expectedStyle: string;
  actualStyle: string;
  conflictingRules: string[];
  source: 'tailwind' | 'semantic' | 'component' | 'override';
  priority: number;
}

export interface StyleAudit {
  page: string;
  conflicts: CSSConflict[];
  missingSemanticClasses: string[];
  tailwindOverrides: string[];
  recommendations: string[];
}

export class CSSArchitectureDebugger {
  private semanticClasses = [
    'card-title', 'card-description', 'card-layout', 'glass-card',
    'header-layout', 'responsive-grid', 'flex-layout', 'flex-column',
    'page-layout', 'container', 'space-y-md', 'text-center'
  ];

  private tailwindPatterns = [
    /^text-(white|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
    /^bg-(white|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
    /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
    /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-\d+/
  ];

  /**
   * Audit a page's CSS architecture compliance
   */
  auditPage(pageSelector: string): StyleAudit {
    const page = document.querySelector(pageSelector);
    if (!page) {
      return {
        page: pageSelector,
        conflicts: [],
        missingSemanticClasses: [],
        tailwindOverrides: [],
        recommendations: ['Page element not found']
      };
    }

    const conflicts: CSSConflict[] = [];
    const missingSemanticClasses: string[] = [];
    const tailwindOverrides: string[] = [];
    const recommendations: string[] = [];

    // Check all elements in the page
    const allElements = page.querySelectorAll('*');
    
    allElements.forEach((element, index) => {
      const classList = Array.from(element.classList);
      const computedStyle = window.getComputedStyle(element);
      
      // Check for Tailwind vs Semantic conflicts
      const hasTailwindClasses = classList.some(cls => 
        this.tailwindPatterns.some(pattern => pattern.test(cls))
      );
      
      const hasSemanticClasses = classList.some(cls => 
        this.semanticClasses.includes(cls)
      );

      // Flag mixed usage
      if (hasTailwindClasses && hasSemanticClasses) {
        conflicts.push({
          element: this.getElementSelector(element),
          expectedStyle: 'Pure semantic classes',
          actualStyle: 'Mixed Tailwind + Semantic',
          conflictingRules: classList.filter(cls => 
            this.tailwindPatterns.some(pattern => pattern.test(cls))
          ),
          source: 'component',
          priority: 2
        });
      }

      // Check for missing semantic classes on common patterns
      if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
        if (!classList.includes('card-title') && !classList.includes('section-title')) {
          missingSemanticClasses.push(`${this.getElementSelector(element)} should use card-title or section-title`);
        }
      }

      // Check for text color issues
      const textColor = computedStyle.color;
      if (element.textContent && element.textContent.trim() && 
          (textColor === 'rgb(128, 128, 128)' || textColor.includes('128'))) {
        conflicts.push({
          element: this.getElementSelector(element),
          expectedStyle: 'White or light gray text',
          actualStyle: `Gray text (${textColor})`,
          conflictingRules: classList.filter(cls => cls.includes('text-')),
          source: 'override',
          priority: 1
        });
      }

      // Check background conflicts
      const backgroundColor = computedStyle.backgroundColor;
      if (backgroundColor === 'rgb(0, 0, 0)' || backgroundColor === 'black') {
        conflicts.push({
          element: this.getElementSelector(element),
          expectedStyle: 'Gradient or transparent background',
          actualStyle: `Black background (${backgroundColor})`,
          conflictingRules: ['CSS override forcing black background'],
          source: 'override',
          priority: 1
        });
      }
    });

    // Generate recommendations
    if (conflicts.length > 0) {
      recommendations.push('Replace Tailwind utility classes with semantic classes');
      recommendations.push('Check for CSS overrides in index.css');
      recommendations.push('Ensure proper import order: tokens.css → base.css → themes.css → layout.css');
    }

    return {
      page: pageSelector,
      conflicts,
      missingSemanticClasses,
      tailwindOverrides,
      recommendations
    };
  }

  /**
   * Generate a specific CSS class mapping for elements
   */
  generateSemanticMapping(element: Element): string {
    const classList = Array.from(element.classList);
    const recommendations: string[] = [];

    // Map common Tailwind patterns to semantic classes
    const mappings = {
      'text-white': 'card-title',
      'text-gray-300': 'card-description',
      'text-gray-400': 'card-description', 
      'text-gray-500': 'card-description',
      'text-muted-foreground': 'card-description',
      'text-foreground': 'card-description',
      'flex items-center justify-between': 'flex-between',
      'flex flex-col': 'flex-column',
      'grid grid-cols-1 md:grid-cols-2': 'responsive-grid-2',
      'grid grid-cols-1 md:grid-cols-3': 'responsive-grid',
      'space-y-6': 'space-y-lg',
      'space-y-4': 'space-y-md',
      'space-y-2': 'space-y-sm'
    };

    classList.forEach(cls => {
      const tailwindPattern = classList.join(' ');
      for (const [pattern, semantic] of Object.entries(mappings)) {
        if (tailwindPattern.includes(pattern)) {
          recommendations.push(`Replace "${pattern}" with "${semantic}"`);
        }
      }
    });

    return recommendations.join('\n');
  }

  /**
   * Get a unique selector for an element
   */
  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${Array.from(element.classList).join('.')}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Quick fix function to apply semantic classes
   */
  quickFix(pageSelector: string): void {
    const audit = this.auditPage(pageSelector);
    console.group('🔧 CSS Architecture Quick Fix');
    console.log('Page:', pageSelector);
    console.log('Conflicts found:', audit.conflicts.length);
    
    audit.conflicts.forEach(conflict => {
      console.warn(`❌ ${conflict.element}: ${conflict.actualStyle}`);
      console.log(`✅ Should be: ${conflict.expectedStyle}`);
    });

    audit.recommendations.forEach(rec => {
      console.log(`💡 ${rec}`);
    });
    
    console.groupEnd();
  }
}

// Global instance for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).cssDebugger = new CSSArchitectureDebugger();
  console.log('🎨 CSS Debugger available as window.cssDebugger');
  console.log('Usage: cssDebugger.auditPage("main") or cssDebugger.quickFix("main")');
}

export const cssDebugger = new CSSArchitectureDebugger();