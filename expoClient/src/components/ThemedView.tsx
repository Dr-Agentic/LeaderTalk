import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';

interface ThemedViewProps extends ViewProps {
  children: React.ReactNode;
}

export function ThemedView({ style, ...props }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#ff0f0f';
  
  return (
    <View 
      style={[{ backgroundColor }, style]} 
      {...props}
    />
  );
}
