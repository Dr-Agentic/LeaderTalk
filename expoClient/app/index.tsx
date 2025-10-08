import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '../src/components/ThemedText';
import { ThemedView } from '../src/components/ThemedView';
import { AnimatedBackground } from '../src/components/ui/AnimatedBackground';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts/AuthContext';

export default function IndexScreen() {
  const theme = useTheme();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return;

    // Redirect based on authentication status
    if (isAuthenticated && user) {
      console.log('🔐 Authenticated user found, redirecting to dashboard');
      router.replace('/dashboard');
    } else {
      console.log('🔐 No authentication, redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user]);

  // Show loading screen while checking authentication
  return (
    <ThemedView style={styles.container}>
      <AnimatedBackground />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={styles.loadingText}>
          {isLoading ? '🔐 Checking authentication...' : 'Redirecting...'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
