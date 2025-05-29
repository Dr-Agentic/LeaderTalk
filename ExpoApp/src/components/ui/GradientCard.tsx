import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface GradientCardProps extends ViewProps {
  children: React.ReactNode;
  colors?: string[];
  style?: any;
}

export const GradientCard = ({ 
  children, 
  colors = [colors.primaryLight, 'rgba(255, 107, 107, 0.1)'],
  style,
  ...props 
}: GradientCardProps) => {
  return (
    <LinearGradient
      colors={colors}
      style={[styles.card, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
});

export default GradientCard;
