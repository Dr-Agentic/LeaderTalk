// Theme configuration for the LeaderTalk app
// This file contains color schemes, spacing, and other design tokens

export const colors = {
  // Main colors
  background: '#0f0f23', // Dark purple-blue background
  foreground: '#ffffff', // White text
  
  // Primary colors
  primary: '#8A2BE2', // Purple
  primaryForeground: '#ffffff',
  
  // Secondary colors
  secondary: 'rgba(255, 255, 255, 0.08)', // Slightly opaque glass
  secondaryForeground: '#ffffff',
  
  // Card and UI elements
  card: 'rgba(255, 255, 255, 0.05)', // Glass card
  cardForeground: '#ffffff',
  
  // Muted elements
  muted: 'rgba(255, 255, 255, 0.05)', // Glass effect
  mutedForeground: 'rgba(255, 255, 255, 0.7)',
  
  // Accent colors
  accent: 'rgba(255, 255, 255, 0.1)', // More visible glass
  accentForeground: '#ffffff',
  
  // Destructive actions
  destructive: '#e11d48',
  destructiveForeground: '#ffffff',
  
  // Borders and inputs
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.05)',
  ring: '#8A2BE2', // Purple focus ring
  
  // Chart colors
  chart: {
    1: '#3b82f6',
    2: '#22c55e',
    3: '#f59e0b',
    4: '#8b5cf6',
    5: '#ec4899',
  },
};

export const gradients = {
  primary: 'linear-gradient(135deg, #8A2BE2, #FF6B6B)',
  primaryHover: 'linear-gradient(135deg, #7B1FA2, #E53E3E)',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%)',
};

export const spacing = {
  section: 40, // 2.5rem
  cardInner: 20, // 1.25rem
};

export const borderRadius = {
  lg: 20, // 1.25rem
  md: 16, // 1rem
  sm: 12, // 0.75rem
};

export const shadows = {
  card: '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.08)',
  cardHover: '0 4px 18px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.12)',
  subtle: '0 2px 8px rgba(0, 0, 0, 0.05)',
  dialog: '0 8px 30px rgba(0, 0, 0, 0.12)',
};

export const fontSizes = {
  heading1: 44, // 2.75rem
  heading2: 36, // 2.25rem
  heading3: 24, // 1.5rem
  bodyLarge: 18, // 1.125rem
  body: 16, // 1rem
};

export const lineHeights = {
  heading1: 1.1,
  heading2: 1.2,
  heading3: 1.3,
  body: 1.6,
};

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Export the complete theme
export const theme = {
  colors,
  gradients,
  spacing,
  borderRadius,
  shadows,
  fontSizes,
  lineHeights,
  fontWeights,
};
