import React, { useEffect, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Session } from '@supabase/supabase-js';
import { initializeSupabase, getSupabase } from '../src/lib/supabaseAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';
import { API_URL } from '../src/lib/api';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    async function initializeAuth() {
      try {
        console.log('Initializing app with API URL:', API_URL);
        
        // Test the API connection first
        try {
          const response = await fetch(`${API_URL}/api/auth/auth-parameters`);
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
        } catch (apiError) {
          console.error('API connection test failed:', apiError);
          throw new Error(`Cannot connect to server at ${API_URL}: ${(apiError as Error).message}`);
        }
        
        // Initialize Supabase with parameters from the server
        await initializeSupabase();
        
        // Get the initialized Supabase client
        const supabase = getSupabase();
        
        // Check for an existing session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('Auth state changed:', session ? 'User authenticated' : 'No user');
          setSession(session);
        });
        
        setIsLoading(false);
        setAuthChecked(true);
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitError((error as Error).message);
        setIsLoading(false);
        setAuthChecked(true);
      }
    }

    initializeAuth();
  }, []);

  // Wait for fonts to load and auth check to complete
  if (!fontsLoaded || isLoading) {
    return (
      <LinearGradient
        colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Loading LeaderTalk...</Text>
      </LinearGradient>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <LinearGradient
        colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
        style={styles.loadingContainer}
      >
        <Text style={styles.errorText}>Failed to initialize app</Text>
        <Text style={styles.errorDetail}>{initError}</Text>
        <Text style={styles.errorHelp}>Please check your connection and restart the app</Text>
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      
      {/* If auth is checked and there's no session, redirect to login */}
      {authChecked && !session && <Redirect href="/login" />}
      
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f0f23',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#0f0f23',
          },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ 
          title: "LeaderTalk Dashboard",
          headerShown: true 
        }} />
        <Stack.Screen name="index" options={{ 
          headerShown: false 
        }} />
      </Stack>
    </GestureHandlerRootView>
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
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorDetail: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorHelp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
