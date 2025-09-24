import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getSupabase } from '../src/lib/supabaseAuth';
import { ThemedText } from '../src/components/ThemedText';
import { AnimatedBackground } from '../src/components/ui/AnimatedBackground';
import { theme } from '../src/styles/theme';

// Set this to true to force logout on app start (useful for testing)
const FORCE_LOGOUT_ON_START = false;

export default function IndexScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    // Check authentication status and redirect accordingly
    const checkAuthAndRedirect = async () => {
      try {
        setDebugInfo('🔐 Starting authentication check...');
        console.log('🔐 Starting authentication check...');
        
        // Small delay to ensure Supabase is initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const supabase = getSupabase();
        
        // Force logout if flag is set (useful for testing login flow)
        if (FORCE_LOGOUT_ON_START) {
          setDebugInfo('🔐 Force logout enabled, clearing session...');
          console.log('🔐 Force logout enabled, clearing existing session...');
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Check current session
        setDebugInfo('🔐 Checking current session...');
        const { data, error } = await supabase.auth.getSession();
        
        console.log('🔐 Session check result:', { 
          hasSession: !!data.session, 
          error: error?.message,
          user: data.session?.user?.email,
          forceLogout: FORCE_LOGOUT_ON_START
        });
        
        if (error) {
          console.error('🔐 Auth check error:', error);
          setDebugInfo('🔐 Auth error, going to login...');
          router.replace('/login');
          return;
        }
        
        if (data.session && !FORCE_LOGOUT_ON_START) {
          console.log('🔐 Valid session found, going to dashboard');
          setDebugInfo('🔐 Valid session, going to dashboard...');
          router.replace('/dashboard');
        } else {
          console.log('🔐 No valid session, going to login');
          setDebugInfo('🔐 No session, going to login...');
          router.replace('/login');
        }
      } catch (error) {
        console.error('🔐 Error in auth check:', error);
        setDebugInfo('🔐 Error occurred, going to login...');
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={styles.loadingText}>
          {isChecking ? debugInfo : 'Redirecting...'}
        </ThemedText>
        {FORCE_LOGOUT_ON_START && (
          <ThemedText style={styles.debugText}>
            (Force logout mode enabled)
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: theme.colors.foreground,
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  debugText: {
    color: theme.colors.mutedForeground,
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});
