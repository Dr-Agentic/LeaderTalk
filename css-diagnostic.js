// Run this in browser console to diagnose TranscriptView styling issues
// Compare with Dashboard page to identify differences

function diagnosePageStyling() {
  console.group('🔍 Page Styling Diagnostic');
  
  // Get current route
  const route = window.location.pathname;
  console.log('Current route:', route);
  
  // Check AppLayout container
  const appContainer = document.querySelector('.app-layout-container') || 
                      document.querySelector('[style*="gradient"]') ||
                      document.querySelector('.flex.full-height.overflow-hidden');
  
  if (appContainer) {
    const containerStyle = window.getComputedStyle(appContainer);
    console.log('App Container:', {
      element: appContainer.className,
      background: containerStyle.background,
      backgroundColor: containerStyle.backgroundColor,
      backgroundImage: containerStyle.backgroundImage
    });
  } else {
    console.warn('❌ App container not found');
  }
  
  // Check body styling
  const bodyStyle = window.getComputedStyle(document.body);
  console.log('Body styling:', {
    background: bodyStyle.background,
    backgroundColor: bodyStyle.backgroundColor
  });
  
  // Check for CSS variable definitions
  const rootStyle = window.getComputedStyle(document.documentElement);
  console.log('CSS Variables:', {
    gradientBackground: rootStyle.getPropertyValue('--gradient-background'),
    colorTextPrimary: rootStyle.getPropertyValue('--color-text-primary'),
    colorTextSecondary: rootStyle.getPropertyValue('--color-text-secondary')
  });
  
  // Check for problematic overrides
  const problematicElements = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.backgroundColor === 'rgb(0, 0, 0)' || style.background.includes('black')) {
      problematicElements.push({
        element: el.tagName + '.' + Array.from(el.classList).join('.'),
        background: style.background
      });
    }
  });
  
  if (problematicElements.length > 0) {
    console.warn('⚠️ Elements with black backgrounds:', problematicElements.slice(0, 5));
  }
  
  // Check text color issues
  const grayTextElements = [];
  document.querySelectorAll('*').forEach(el => {
    const style = window.getComputedStyle(el);
    if (el.textContent && el.textContent.trim() && 
        (style.color.includes('128') || style.color === 'gray')) {
      grayTextElements.push({
        element: el.tagName + '.' + Array.from(el.classList).join('.'),
        color: style.color,
        text: el.textContent.substring(0, 30) + '...'
      });
    }
  });
  
  if (grayTextElements.length > 0) {
    console.warn('⚠️ Elements with gray text:', grayTextElements.slice(0, 3));
  }
  
  console.groupEnd();
  
  // Return summary
  return {
    route,
    hasAppContainer: !!appContainer,
    backgroundIssues: problematicElements.length,
    textColorIssues: grayTextElements.length,
    recommendation: problematicElements.length > 0 ? 
      'Check CSS specificity conflicts in index.css' : 
      'Styling appears correct'
  };
}

// Auto-run if in TranscriptView
if (window.location.pathname.includes('/transcript/')) {
  setTimeout(() => {
    console.log('🚀 Auto-diagnosing TranscriptView...');
    diagnosePageStyling();
  }, 1000);
}

// Make available globally
window.diagnosePageStyling = diagnosePageStyling;