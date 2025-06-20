import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';

interface GlassBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  showShimmer?: boolean;
  variant?: 'default' | 'hero' | 'card';
}

export function GlassBackground({ 
  children, 
  style, 
  intensity = 20,
  showShimmer = false,
  variant = 'default'
}: GlassBackgroundProps) {
  const shimmerAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (showShimmer) {
      shimmerAnimation.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [showShimmer]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
      opacity: showShimmer ? 0.3 : 0,
    };
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(138, 43, 226, 0.2)',
        };
      case 'card':
        return {
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        };
      default:
        return {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        };
    }
  };

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          position: 'relative',
        },
        getVariantStyles(),
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* Glass overlay */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: variant === 'hero' 
            ? 'rgba(138, 43, 226, 0.05)' 
            : 'rgba(255, 255, 255, 0.05)',
        }}
      />

      {/* Shimmer effect */}
      {showShimmer && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: -100,
              right: -100,
              bottom: 0,
              zIndex: 1,
            },
            shimmerStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255, 255, 255, 0.1)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              width: 100,
            }}
          />
        </Animated.View>
      )}

      {/* Content */}
      <View style={{ zIndex: 2 }}>
        {children}
      </View>
    </View>
  );
}
