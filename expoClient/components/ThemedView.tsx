import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'card' | 'elevated';
}

export function ThemedView({ variant = 'default', style, ...props }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#ffffff';
  
  let viewStyle;
  switch (variant) {
    case 'card':
      viewStyle = styles.card;
      break;
    case 'elevated':
      viewStyle = styles.elevated;
      break;
    default:
      viewStyle = {};
  }
  
  return (
    <View 
      style={[viewStyle, { backgroundColor }, style]} 
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  elevated: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
