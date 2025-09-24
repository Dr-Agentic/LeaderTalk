import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  style?: ViewStyle;
  backgroundColor?: string;
  progressColor?: string;
  useGradient?: boolean;
}

export function ProgressBar({
  progress,
  height = 6,
  style,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  progressColor = '#8A2BE2',
  useGradient = true,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const progressWidth = `${clampedProgress * 100}%`;

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <View style={[styles.progressContainer, { width: progressWidth }]}>
        {useGradient ? (
          <LinearGradient
            colors={['#8A2BE2', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        ) : (
          <View style={[styles.progressSolid, { backgroundColor: progressColor }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressContainer: {
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressSolid: {
    flex: 1,
  },
});
