import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { fonts } from '../../theme/fonts';
import { colors } from '../../theme/colors';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

// H1 - Main Heading (Libre Franklin)
export const H1 = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.h1, style]} {...props}>
    {children}
  </Text>
);

// H2 - Section Heading (Ancizar Sans/Source Sans Pro)
export const H2 = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.h2, style]} {...props}>
    {children}
  </Text>
);

// H3 - Subsection Heading
export const H3 = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.h3, style]} {...props}>
    {children}
  </Text>
);

// H4 - Small Heading
export const H4 = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.h4, style]} {...props}>
    {children}
  </Text>
);

// Paragraph - Default
export const Paragraph = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.paragraph, style]} {...props}>
    {children}
  </Text>
);

// Small text for captions, metadata, etc.
export const SmallText = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.smallText, style]} {...props}>
    {children}
  </Text>
);

// Lead text for introductions
export const Lead = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.lead, style]} {...props}>
    {children}
  </Text>
);

// Muted text for secondary information
export const Muted = ({ children, style, ...props }: TypographyProps) => (
  <Text style={[styles.muted, style]} {...props}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  h1: {
    fontFamily: fonts.franklin,
    fontSize: 32,
    fontWeight: fonts.extrabold,
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fonts.ancizar,
    fontSize: 24,
    fontWeight: fonts.bold,
    color: colors.foreground,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fonts.sans,
    fontSize: 20,
    fontWeight: fonts.bold,
    color: colors.foreground,
  },
  h4: {
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: fonts.semibold,
    color: colors.foreground,
  },
  paragraph: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
    lineHeight: 24,
  },
  smallText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 18,
    color: colors.foreground,
    lineHeight: 28,
  },
  muted: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.mutedForeground,
    lineHeight: 24,
  },
});
