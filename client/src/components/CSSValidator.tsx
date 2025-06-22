import { useEffect, useState } from "react";

interface CSSValidationResult {
  backgroundValid: boolean;
  textColorsValid: boolean;
  semanticClassesUsed: boolean;
  issues: string[];
  recommendations: string[];
}

export function CSSValidator({ pageSelector = "main" }: { pageSelector?: string }) {
  const [validation, setValidation] = useState<CSSValidationResult | null>(null);
  const [isDev] = useState(() => import.meta.env.DEV);

  useEffect(() => {
    if (!isDev) return;

    const validateCSS = () => {
      const pageElement = document.querySelector(pageSelector);
      if (!pageElement) return;

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check background gradient
      const computedStyle = window.getComputedStyle(pageElement);
      const background = computedStyle.background || computedStyle.backgroundColor;
      const backgroundValid = background.includes('gradient') || background.includes('linear-gradient');
      
      if (!backgroundValid) {
        issues.push('Page background not using gradient');
        recommendations.push('Ensure AppLayout applies --gradient-background CSS variable');
      }

      // Check for problematic text colors
      const allElements = pageElement.querySelectorAll('*');
      let grayTextFound = false;
      let undefinedClassesFound = false;
      let semanticClassesUsed = false;

      allElements.forEach(element => {
        const classList = Array.from(element.classList);
        const elementStyle = window.getComputedStyle(element);
        
        // Check for gray text (potential issue)
        const textColor = elementStyle.color;
        if (textColor.includes('128, 128, 128') || textColor === 'rgb(128, 128, 128)') {
          grayTextFound = true;
          issues.push(`Gray text detected: ${element.tagName.toLowerCase()}.${classList.join('.')}`);
        }

        // Check for undefined classes
        if (classList.some(cls => cls.includes('text-foreground') || cls.includes('text-muted-foreground'))) {
          undefinedClassesFound = true;
          issues.push(`Undefined CSS class: ${classList.find(cls => cls.includes('foreground'))}`);
        }

        // Check for semantic classes usage
        if (classList.some(cls => ['card-title', 'card-description', 'glass-card', 'card-layout'].includes(cls))) {
          semanticClassesUsed = true;
        }
      });

      if (grayTextFound) {
        recommendations.push('Replace undefined text classes with semantic classes (card-title, card-description)');
      }

      if (undefinedClassesFound) {
        recommendations.push('Replace text-foreground and text-muted-foreground with semantic alternatives');
      }

      if (!semanticClassesUsed) {
        recommendations.push('Use semantic CSS classes instead of Tailwind utilities for consistency');
      }

      setValidation({
        backgroundValid,
        textColorsValid: !grayTextFound,
        semanticClassesUsed,
        issues,
        recommendations
      });
    };

    // Initial validation
    validateCSS();

    // Re-validate on style changes
    const observer = new MutationObserver(validateCSS);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    return () => observer.disconnect();
  }, [pageSelector, isDev]);

  if (!isDev || !validation) return null;

  const hasIssues = validation.issues.length > 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: hasIssues ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        CSS Architecture Status
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        Background: {validation.backgroundValid ? '✅' : '❌'}<br/>
        Text Colors: {validation.textColorsValid ? '✅' : '❌'}<br/>
        Semantic Classes: {validation.semanticClassesUsed ? '✅' : '❌'}
      </div>

      {validation.issues.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>Issues:</div>
          {validation.issues.slice(0, 3).map((issue, i) => (
            <div key={i} style={{ fontSize: '10px' }}>• {issue}</div>
          ))}
        </div>
      )}

      {validation.recommendations.length > 0 && (
        <div>
          <div style={{ fontWeight: 'bold' }}>Fixes:</div>
          {validation.recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} style={{ fontSize: '10px' }}>• {rec}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CSSValidator;