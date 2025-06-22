import React from 'react';
import { View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FloatingLightProps {
  size: number;
  color: string;
  duration: number;
  delay: number;
  initialX: number;
  initialY: number;
}

function FloatingLight({ size, color, duration, delay, initialX, initialY }: FloatingLightProps) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const opacity = useSharedValue(0.4); // Increased from 0.15 for better visibility
  const scale = useSharedValue(1);

  React.useEffect(() => {
    // Floating animation
    translateX.value = withRepeat(
      withSequence(
        withTiming(initialX + 100, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(initialX - 100, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(initialY - 80, { duration: duration / 3, easing: Easing.inOut(Easing.sin) }),
        withTiming(initialY + 80, { duration: duration / 3, easing: Easing.inOut(Easing.sin) }),
        withTiming(initialY, { duration: duration / 3, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Enhanced pulsing animation with higher opacity for visibility
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    scale.value = withRepeat(
      withTiming(1.8, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <BlurView
        intensity={25}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: size / 2,
        }}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={`grad-${color}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <Stop offset="30%" stopColor={color} stopOpacity="0.25" />
              <Stop offset="60%" stopColor={color} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2}
            fill={`url(#grad-${color})`}
          />
        </Svg>
      </BlurView>
    </Animated.View>
  );
}

export function AnimatedBackground() {
  const rotation = useSharedValue(0);
  const conicRotation = useSharedValue(0);

  React.useEffect(() => {
    // Main background rotation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 25000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Conic gradient rotation (like the web version)
    conicRotation.value = withRepeat(
      withTiming(360, {
        duration: 6000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const conicAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${conicRotation.value}deg` }],
  }));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Base gradient background */}
      <LinearGradient
        colors={['#0f0f23', '#1a0033', '#0f0f23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />

      {/* Rotating conic gradient overlay (simulating the web version) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: width * 2,
            height: height * 2,
            left: -width / 2,
            top: -height / 2,
          },
          conicAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(138, 43, 226, 0.1)',
            'transparent',
            'rgba(138, 43, 226, 0.05)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: width }}
        />
      </Animated.View>

      {/* Main rotating gradient */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: width * 1.5,
            height: height * 1.5,
            left: -width / 4,
            top: -height / 4,
          },
          backgroundAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(138, 43, 226, 0.15)',
            'transparent',
            'rgba(255, 107, 107, 0.1)',
            'transparent',
            'rgba(76, 205, 196, 0.08)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: width }}
        />
      </Animated.View>

      {/* Floating light orbs */}
      <FloatingLight
        size={250}
        color="rgba(138, 43, 226, 0.2)"
        duration={8000}
        delay={0}
        initialX={width * 0.2}
        initialY={height * 0.3}
      />
      
      <FloatingLight
        size={200}
        color="rgba(255, 107, 107, 0.15)"
        duration={12000}
        delay={2000}
        initialX={width * 0.7}
        initialY={height * 0.6}
      />
      
      <FloatingLight
        size={180}
        color="rgba(76, 205, 196, 0.12)"
        duration={10000}
        delay={4000}
        initialX={width * 0.5}
        initialY={height * 0.8}
      />

      <FloatingLight
        size={220}
        color="rgba(138, 43, 226, 0.1)"
        duration={15000}
        delay={1000}
        initialX={width * 0.8}
        initialY={height * 0.2}
      />

      <FloatingLight
        size={160}
        color="rgba(255, 107, 107, 0.08)"
        duration={9000}
        delay={3000}
        initialX={width * 0.1}
        initialY={height * 0.7}
      />

      {/* Subtle overlay for depth */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />
    </View>
  );
}
