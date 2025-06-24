import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getSupabase } from '../src/lib/supabaseAuth';
import { ThemedText } from '../src/components/ThemedText';
import { AnimatedBackground } from '../src/components/ui/AnimatedBackground';

export default function IndexScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication status and redirect accordingly
    const checkAuthAndRedirect = async () => {
      try {
        console.log('🔐 Checking authentication status...');
        
        // Small delay to ensure Supabase is initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 Auth check error:', error);
          router.replace('/login');
          return;
        }
        
        if (data.session) {
          console.log('🔐 User is authenticated, redirecting to dashboard');
          router.replace('/dashboard');
        } else {
          console.log('🔐 User is not authenticated, redirecting to login');
          router.replace('/login');
        }
      } catch (error) {
        console.error('🔐 Error checking auth status:', error);
        // On error, redirect to login as a fallback
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuthAndRedirect();
  }, []);

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <ThemedText style={styles.loadingText}>
          {isChecking ? 'Checking authentication...' : 'Redirecting...'}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
});
