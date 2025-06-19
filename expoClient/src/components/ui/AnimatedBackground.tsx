import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
}

export const AnimatedBackground = ({ children }: AnimatedBackgroundProps) => {
  // Animation values for the glowing orbs
  const purpleOpacity = new Animated.Value(0.5);
  const pinkOpacity = new Animated.Value(0.5);
  
  // Set up the animations
  useEffect(() => {
    // Purple glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(purpleOpacity, {
          toValue: 0.8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(purpleOpacity, {
          toValue: 0.5,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Pink glow animation with delay
    Animated.loop(
      Animated.sequence([
        Animated.timing(pinkOpacity, {
          toValue: 0.8,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pinkOpacity, {
          toValue: 0.5,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background elements */}
      <View style={styles.backgroundElements}>
        <Animated.View 
          style={[
            styles.purpleGlow, 
            { opacity: purpleOpacity }
          ]} 
        />
        <Animated.View 
          style={[
            styles.pinkGlow, 
            { opacity: pinkOpacity }
          ]} 
        />
      </View>
      
      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  purpleGlow: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 150,
  },
  pinkGlow: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 150,
  },
});
