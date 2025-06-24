import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initializeSupabase } from '../src/lib/supabaseAuth';
import { ActivityIndicator } from 'react-native';
import { API_URL } from '../src/lib/api';
import { AnimatedBackground } from '../src/components/ui/AnimatedBackground';

// Add React Native Web style overrides
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Inject CSS to override React Native Web default backgrounds
  const style = document.createElement('style');
  style.textContent = `
    /* Override React Native Web default gray backgrounds */
    .css-view-g5y9jx {
      background-color: transparent !important;
    }
    
    /* Target specific problematic classes */
    .css-view-g5y9jx.r-backgroundColor-ma12yy {
      background-color: transparent !important;
    }
    
    .css-view-g5y9jx.r-flex-13awgt0 {
      background-color: transparent !important;
    }
    
    .css-view-g5y9jx.r-position-u8s1d {
      background-color: transparent !important;
    }
    
    /* Override any element with the specific gray background */
    .css-view-g5y9jx[style*="background-color: rgb(242, 242, 242)"] {
      background-color: transparent !important;
    }
    
    /* Ensure root elements maintain dark theme */
    #root, body {
      background-color: #0f0f23 !important;
      margin: 0;
      padding: 0;
    }
  `;
  document.head.appendChild(style);
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [initError, setInitError] = useState<string | null>(null);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    // Initialize Supabase
    const initializeAuth = async () => {
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
        console.log('Supabase initialized successfully');
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitError((error as Error).message);
      }
    };

    initializeAuth();
  }, []);

  // Wait for fonts to load
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Loading LeaderTalk...</Text>
        </View>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to initialize app</Text>
          <Text style={styles.errorDetail}>{initError}</Text>
          <Text style={styles.errorHelp}>Please check your connection and restart the app</Text>
        </View>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" translucent />
        <AnimatedBackground />
        
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: {
              backgroundColor: 'transparent',
            },
            headerTransparent: true,
            headerShown: false, // We'll use our custom header
            // Add explicit styling for React Native Web
            cardStyle: {
              backgroundColor: 'transparent',
            },
            presentation: 'card',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ 
            title: "LeaderTalk Dashboard",
            headerShown: false 
          }} />
          <Stack.Screen name="recording" options={{ 
            title: "Record Conversation",
            headerShown: false 
          }} />
          <Stack.Screen name="transcripts" options={{ 
            title: "All Transcripts",
            headerShown: false 
          }} />
          <Stack.Screen name="progress" options={{ 
            title: "Your Progress",
            headerShown: false 
          }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="deep-link-test" options={{ 
            title: "Deep Link Test",
            headerShown: false 
          }} />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
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
