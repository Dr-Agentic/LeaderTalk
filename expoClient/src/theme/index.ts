export interface Theme {
  colors: {
    // Base colors
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Surface colors
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    disabled: string;
    
    // Glass morphism colors
    glass: {
      light: string;
      medium: string;
      heavy: string;
    };
    
    // Glow effects
    glow: {
      faint: string;
      subtle: string;
      medium: string;
      primary: string;
    };
    
    // Additional colors
    border: string;
    overlay: string;
    coral: string;
    teal: string;
    
    // Chart colors
    chart: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
  };
  isDark: boolean;
}

export const theme: Theme = {
  colors: {
    // Base colors
    primary: '#8A2BE2',
    primaryHover: '#9A3BE2',
    secondary: '#4ECDC4',
    accent: '#FF6B6B',
    
    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Surface colors
    background: '#0A0A0A',
    surface: '#1A1A1A',
    foreground: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.7)',
    disabled: '#666666',
    
    // Glass morphism colors
    glass: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.1)',
      heavy: 'rgba(255, 255, 255, 0.2)',
    },
    
    // Glow effects
    glow: {
      faint: 'rgba(138, 43, 226, 0.1)',
      subtle: 'rgba(138, 43, 226, 0.2)',
      medium: 'rgba(138, 43, 226, 0.3)',
      primary: 'rgba(138, 43, 226, 0.4)',
    },
    
    // Additional colors
    border: 'rgba(255, 255, 255, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    coral: '#FF6B6B',
    teal: '#4ECDC4',
    
    // Chart colors
    chart: {
      1: '#3b82f6',
      2: '#22c55e', 
      3: '#f59e0b',
      4: '#8b5cf6',
      5: '#ec4899',
    },
  },
  isDark: true,
};
