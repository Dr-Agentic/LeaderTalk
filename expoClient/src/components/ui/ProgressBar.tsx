import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

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
  backgroundColor,
  progressColor,
  useGradient = true,
}: ProgressBarProps) {
  const theme = useTheme();
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const progressWidth = `${clampedProgress * 100}%`;
  
  const bgColor = backgroundColor || theme.colors.glass.medium;
  const progColor = progressColor || theme.colors.primary;

  return (
    <View style={[styles.container, { height, backgroundColor: bgColor }, style]}>
      <View style={[styles.progressContainer, { width: progressWidth }]}>
        {useGradient ? (
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        ) : (
          <View style={[styles.progressSolid, { backgroundColor: progColor }]} />
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
