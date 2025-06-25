import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/src/hooks/useColorScheme';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Simple timeout instead of animation
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colorScheme === 'dark' ? '#121212' : '#ff0f2f' } // Morsy: 2025-06-24 allow me to identify the culprit easily.
    ]}>
      <View>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <ThemedText type="title" style={styles.title}>
          LeaderTalk
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Elevate Your Communication
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.8,
    textAlign: 'center',
  },
});
