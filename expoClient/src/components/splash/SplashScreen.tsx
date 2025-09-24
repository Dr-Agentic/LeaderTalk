import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import logoImage from '../../../assets/images/LeaderTalk-2025-05-30.png';
import { theme } from '../../styles/theme';

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SplashScreen({ 
  onComplete, 
  minDisplayTime = 2500 
}: SplashScreenProps) {
  const [isComplete, setIsComplete] = useState(false);
  
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  
  // Pulsing dots animation
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start entrance animations
    const logoAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
    ]);

    const textAnimation = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 500,
        useNativeDriver: true,
      }),
    ]);

    const dotsAnimation = Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 600,
      delay: 800,
      useNativeDriver: true,
    });

    // Start all animations
    Animated.sequence([
      logoAnimation,
      Animated.parallel([textAnimation, dotsAnimation]),
    ]).start();

    // Start pulsing dots animation
    const createPulseAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnimations = Animated.parallel([
      createPulseAnimation(dot1Opacity, 0),
      createPulseAnimation(dot2Opacity, 300),
      createPulseAnimation(dot3Opacity, 600),
    ]);

    // Start pulsing after initial animations
    const pulseTimeout = setTimeout(() => {
      pulseAnimations.start();
    }, 800);

    // Complete splash screen after minimum time
    const completionTimer = setTimeout(() => {
      setIsComplete(true);
      onComplete();
    }, minDisplayTime);

    return () => {
      clearTimeout(pulseTimeout);
      clearTimeout(completionTimer);
      pulseAnimations.stop();
    };
  }, [minDisplayTime, onComplete]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          'rgba(138, 43, 226, 0.2)', // primary/20
          '#0f0f23', // background
          'rgba(138, 43, 226, 0.1)', // primary/10
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={logoImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Text Content */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>LeaderTalk</Text>
          <Text style={styles.subtitle}>
            Talk Like the Leader You Aspire to Be
          </Text>
        </Animated.View>
        
        {/* Loading Dots */}
        <Animated.View
          style={[
            styles.dotsContainer,
            { opacity: dotsOpacity },
          ]}
        >
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot1Opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot2Opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot3Opacity },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: screenWidth * 0.4, // Responsive sizing
    maxWidth: 192, // Max width equivalent to md:w-48
    minWidth: 160, // Min width equivalent to w-40
    aspectRatio: 1,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: screenWidth > 768 ? 24 : 20, // Responsive text size
    fontWeight: '600',
    color: '#8A2BE2', // Primary color
    textAlign: 'center',
    marginBottom: 4,
    // Gradient text effect would require additional library
    // For now using solid primary color
  },
  subtitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.7)', // Secondary color
    textAlign: 'center',
    lineHeight: screenWidth > 768 ? 24 : 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8A2BE2', // Primary color
  },
});
