import React from 'react';
import { TouchableOpacity, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'cta';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  loading = false,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const shimmerPosition = useSharedValue(-100);

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.95, { damping: 15 });
    glowOpacity.value = withTiming(1, { duration: 150 });
    
    // Shimmer effect on press
    shimmerPosition.value = withTiming(100, { duration: 600 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 15 });
    glowOpacity.value = withTiming(0, { duration: 300 });
    shimmerPosition.value = -100;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-100, 100],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 20,
          minHeight: 56,
        };
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 16,
          minHeight: 48,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const renderButtonContent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <ThemedText
        style={[
          {
            fontSize: getTextSize(),
            fontWeight: '600',
            color: variant === 'secondary' ? 'rgba(255, 255, 255, 0.9)' : 'white',
            textAlign: 'center',
          },
          textStyle,
        ]}
      >
        {loading ? 'Loading...' : title}
      </ThemedText>
    </View>
  );

  if (variant === 'cta') {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled || loading}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                borderRadius: getSizeStyles().borderRadius + 4,
                backgroundColor: 'transparent',
                shadowColor: '#8A2BE2',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 20,
              },
              glowStyle,
            ]}
          />

          <LinearGradient
            colors={['#8A2BE2', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              getSizeStyles(),
              {
                opacity: disabled ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
              },
            ]}
          >
            {/* Shimmer effect */}
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
                colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, width: 100 }}
              />
            </Animated.View>

            <View style={{ zIndex: 2 }}>
              {renderButtonContent()}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'glass') {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled || loading}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <View
            style={[
              getSizeStyles(),
              {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                opacity: disabled ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
              },
            ]}
          >
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
            
            <View style={{ zIndex: 2 }}>
              {renderButtonContent()}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled || loading}
          style={[
            getSizeStyles(),
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          {renderButtonContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Default primary variant
  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={['#8A2BE2', '#7B1FA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            getSizeStyles(),
            {
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          {renderButtonContent()}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
