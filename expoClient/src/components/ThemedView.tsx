import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { theme } from '../styles/theme';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
}

export function ThemedView({ style, ...props }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? theme.colors.background : theme.colors.destructive;
  
  return (
    <View 
      style={[{ backgroundColor }, style]} 
      {...props}
    />
  );
}
