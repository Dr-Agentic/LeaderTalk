import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) => {
  const theme = useTheme();
  
  // Determine padding based on prop
  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return {};
      case 'sm':
        return { padding: 12 };
      case 'md':
        return { padding: 16 };
      case 'lg':
        return { padding: 24 };
      default:
        return { padding: 16 };
    }
  };

  // Get variant-specific styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'glass':
        return styles.glassCard;
      case 'outline':
        return styles.outlineCard;
      default:
        return styles.defaultCard;
    }
  };

  const paddingStyle = getPaddingStyle();
  const variantStyle = getVariantStyle();

  // For glass variant, use BlurView
  if (variant === 'glass') {
    return (
      <View style={[styles.cardContainer, variantStyle, paddingStyle, style]}>
        <BlurView intensity={20} tint="dark" style={styles.blurView}>
          {children}
        </BlurView>
      </View>
    );
  }

  // For other variants
  return (
    <View style={[styles.cardContainer, variantStyle, paddingStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outlineCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  blurView: {
    flex: 1,
    padding: 16,
  },
});
