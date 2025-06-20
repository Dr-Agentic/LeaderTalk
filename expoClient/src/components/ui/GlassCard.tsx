import React from 'react';
import { View, TouchableOpacity, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  icon?: string;
  title?: string;
  description?: string;
  showShimmer?: boolean;
  variant?: 'default' | 'hero' | 'interactive';
  disabled?: boolean;
}

export function GlassCard({ 
  children, 
  style, 
  onPress, 
  icon, 
  title, 
  description,
  showShimmer = false,
  variant = 'default',
  disabled = false
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shimmerAnimation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (showShimmer) {
      shimmerAnimation.value = withRepeat(
        withTiming(1, {
          duration: 3000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [showShimmer]);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.95, { damping: 15 });
    translateY.value = withSpring(2, { damping: 15 });
    glowOpacity.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15 });
    translateY.value = withSpring(-4, { damping: 15 });
    glowOpacity.value = withTiming(0.7, { duration: 300 });
    
    setTimeout(() => {
      translateY.value = withSpring(0, { damping: 15 });
      glowOpacity.value = withTiming(0, { duration: 500 });
    }, 100);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerAnimation.value,
      [0, 1],
      [-300, 300]
    );

    return {
      transform: [{ translateX }],
      opacity: showShimmer ? 0.4 : 0,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(138, 43, 226, 0.3)',
          minHeight: 120,
        };
      case 'interactive':
        return {
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)',
          minHeight: 80,
        };
      default:
        return {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        };
    }
  };

  const CardContent = () => (
    <View style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Blur background */}
      <BlurView
        intensity={20}
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
            ? 'rgba(138, 43, 226, 0.08)' 
            : 'rgba(255, 255, 255, 0.05)',
        }}
      />

      {/* Glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: variant === 'hero' ? 26 : variant === 'interactive' ? 22 : 18,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: 'rgba(138, 43, 226, 0.4)',
          },
          glowStyle,
        ]}
      />

      {/* Shimmer effect */}
      {showShimmer && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: -150,
              right: -150,
              bottom: 0,
              zIndex: 1,
            },
            shimmerStyle,
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              variant === 'hero' 
                ? 'rgba(138, 43, 226, 0.2)' 
                : 'rgba(255, 255, 255, 0.15)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              width: 150,
            }}
          />
        </Animated.View>
      )}

      {/* Content */}
      <View style={{ zIndex: 2, padding: 16 }}>
        {icon && title && description ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'rgba(138, 43, 226, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <ThemedText style={{ fontSize: 20 }}>{icon}</ThemedText>
              </View>
              <ThemedText 
                style={{ 
                  fontSize: 18, 
                  fontWeight: '600', 
                  color: 'white',
                  flex: 1
                }}
              >
                {title}
              </ThemedText>
            </View>
            <ThemedText 
              style={{ 
                fontSize: 14, 
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 20
              }}
            >
              {description}
            </ThemedText>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Animated.View style={[getVariantStyles(), style, animatedStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={{ flex: 1 }}
        >
          <CardContent />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[getVariantStyles(), style, animatedStyle]}>
      <CardContent />
    </Animated.View>
  );
}
