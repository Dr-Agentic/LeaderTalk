import React from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  progress: number; // 0-100
  style?: ViewStyle;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  style,
  height = 8,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  progressColor,
  animated = true,
}: ProgressBarProps) {
  const progressWidth = useSharedValue(0);

  React.useEffect(() => {
    const targetWidth = Math.max(0, Math.min(100, progress));
    if (animated) {
      progressWidth.value = withSpring(targetWidth, { damping: 15 });
    } else {
      progressWidth.value = targetWidth;
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          backgroundColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      >
        {progressColor ? (
          <View
            style={{
              flex: 1,
              backgroundColor: progressColor,
              borderRadius: height / 2,
            }}
          />
        ) : (
          <LinearGradient
            colors={['#8A2BE2', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              borderRadius: height / 2,
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}
