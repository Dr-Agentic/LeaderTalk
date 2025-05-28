import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';

interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = ({ 
  orientation = 'horizontal', 
  style, 
  ...props 
}: SeparatorProps) => (
  <View 
    style={[
      styles.separator, 
      orientation === 'horizontal' ? styles.horizontal : styles.vertical,
      style
    ]} 
    {...props} 
  />
);

const styles = StyleSheet.create({
  separator: {
    backgroundColor: colors.border,
  },
  horizontal: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  vertical: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
});
