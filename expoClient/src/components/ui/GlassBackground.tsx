import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export const GlassBackground = ({
  children,
  style,
  intensity = 20,
}: GlassBackgroundProps) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <BlurView intensity={intensity} tint="dark" style={styles.blurView}>
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  blurView: {
    flex: 1,
  },
});
