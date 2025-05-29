import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface GradientCardProps extends ViewProps {
  children: React.ReactNode;
  gradientColors?: string[];
  style?: any;
}

export const GradientCard = ({ 
  children, 
  gradientColors = colors.heroGradient,
  style,
  ...props 
}: GradientCardProps) => {
  return (
    <LinearGradient
      colors={gradientColors}
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
    borderColor: colors.heroBorder,
  },
});

export default GradientCard;
