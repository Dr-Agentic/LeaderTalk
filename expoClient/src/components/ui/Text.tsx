import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface TextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'body-large' | 'caption' | 'gradient';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  style?: TextStyle;
}

export const Text = ({
  children,
  variant = 'body',
  weight = 'normal',
  color,
  align = 'auto',
  style,
}: TextProps) => {
  // Get variant-specific styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'body-large':
        return styles.bodyLarge;
      case 'caption':
        return styles.caption;
      case 'gradient':
        return styles.gradient;
      default:
        return styles.body;
    }
  };

  // Get font weight style
  const getWeightStyle = () => {
    switch (weight) {
      case 'medium':
        return styles.medium;
      case 'semibold':
        return styles.semibold;
      case 'bold':
        return styles.bold;
      default:
        return styles.normal;
    }
  };

  const variantStyle = getVariantStyle();
  const weightStyle = getWeightStyle();
  const colorStyle = color ? { color } : {};
  const alignStyle = { textAlign: align };

  return (
    <RNText style={[styles.base, variantStyle, weightStyle, colorStyle, alignStyle, style]}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: theme.colors.foreground,
  },
  h1: {
    fontSize: theme.fontSizes.heading1,
    lineHeight: theme.fontSizes.heading1 * theme.lineHeights.heading1,
    fontWeight: '700',
  },
  h2: {
    fontSize: theme.fontSizes.heading2,
    lineHeight: theme.fontSizes.heading2 * theme.lineHeights.heading2,
    fontWeight: '600',
  },
  h3: {
    fontSize: theme.fontSizes.heading3,
    lineHeight: theme.fontSizes.heading3 * theme.lineHeights.heading3,
    fontWeight: '700',
  },
  bodyLarge: {
    fontSize: theme.fontSizes.bodyLarge,
    lineHeight: theme.fontSizes.bodyLarge * theme.lineHeights.body,
  },
  body: {
    fontSize: theme.fontSizes.body,
    lineHeight: theme.fontSizes.body * theme.lineHeights.body,
  },
  caption: {
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  gradient: {
    fontSize: theme.fontSizes.body,
    lineHeight: theme.fontSizes.body * theme.lineHeights.body,
    // Note: Gradient text requires additional implementation with MaskedView
  },
  normal: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
});
