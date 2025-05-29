import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps extends ViewProps {
  children: React.ReactNode;
  gradientColors?: string[];
  style?: any;
}

export const GradientCard = ({ 
  children, 
  gradientColors = ['rgba(138, 43, 226, 0.1)', 'rgba(255, 107, 107, 0.1)'],
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
    borderColor: 'rgba(138, 43, 226, 0.2)',
  },
});

export default GradientCard;
