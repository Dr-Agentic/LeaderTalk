import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { useTheme } from '../../src/hooks/useTheme';

interface ThemedTextProps extends TextProps {
  type?: 'default' | 'defaultSemiBold' | 'title' | 'subtitle' | 'small';
  children: React.ReactNode;
}

export function ThemedText({ type = 'default', style, ...props }: ThemedTextProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const color = colorScheme === 'dark' ? theme.colors.foreground : '#000000';
  
  let textStyle;
  switch (type) {
    case 'title':
      textStyle = styles.title;
      break;
    case 'subtitle':
      textStyle = styles.subtitle;
      break;
    case 'defaultSemiBold':
      textStyle = styles.defaultSemiBold;
      break;
    case 'small':
      textStyle = styles.small;
      break;
    default:
      textStyle = styles.default;
  }
  
  return (
    <Text 
      style={[textStyle, { color }, style]} 
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    fontWeight: '400',
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
  },
});
