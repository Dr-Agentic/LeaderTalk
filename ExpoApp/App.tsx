import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RecordingScreen from './src/screens/RecordingScreen';
import TranscriptViewScreen from './src/screens/TranscriptViewScreen';
import AllTranscriptsScreen from './src/screens/AllTranscriptsScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import auth and API functions
import { initializeSupabase } from './src/supabase';
import { onAuthStateChanged, setupAuthUrlListener, AuthUser } from './src/lib/supabaseAuth';
import { apiRequest } from './src/lib/api';

// Ensure WebBrowser redirects work properly
WebBrowser.maybeCompleteAuthSession();

// Define navigation types
type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

type AuthStackParamList = {
  Login: undefined;
};

type MainStackParamList = {
  Dashboard: undefined;
  Recording: undefined;
  Transcripts: undefined;
  TranscriptView: { id: number };
  Training: undefined;
  Settings: undefined;
};

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Auth navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// Main navigator
const MainNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Dashboard" component={DashboardScreen} />
    <MainStack.Screen name="Recording" component={RecordingScreen} />
    <MainStack.Screen name="Transcripts" component={AllTranscriptsScreen} />
    <MainStack.Screen name="TranscriptView" component={TranscriptViewScreen} />
    <MainStack.Screen name="Training" component={TrainingScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
  </MainStack.Navigator>
);

// Configure linking
const linking = {
  prefixes: ['leadertalk://', 'https://app.leadertalk.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
        },
      },
      Onboarding: 'onboarding',
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Recording: 'recording',
          Transcripts: 'transcripts',
          TranscriptView: 'transcript/:id',
          Training: 'training',
          Settings: 'settings',
        },
      },
    },
  },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize app
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log("Initializing app...");
        
        // Initialize Supabase
        await initializeSupabase();
        console.log("Supabase initialized");
        
        // Set up auth URL listener
        const unsubscribeUrlListener = setupAuthUrlListener();
        
        // Set up auth state listener
        const unsubscribeAuthListener = onAuthStateChanged(async (currentUser) => {
          console.log("Auth state changed:", currentUser ? "User authenticated" : "No user");
          
          setUser(currentUser);
          setIsAuthenticated(!!currentUser);
          
          if (currentUser) {
            // User is authenticated, check if onboarding is complete
            try {
              const userData = await apiRequest('GET', '/api/users/me');
              
              // Check if onboarding is complete
              setOnboardingComplete(
                !!(userData.dateOfBirth && userData.profession && userData.goals && userData.selectedLeaders)
              );
            } catch (error) {
              console.error("Failed to fetch user data:", error);
              setOnboardingComplete(false);
            }
          } else {
            setOnboardingComplete(false);
          }
          
          setIsLoading(false);
        });
        
        // Hide splash screen after a delay
        setTimeout(() => {
          setShowSplash(false);
        }, 2000);
        
        return () => {
          unsubscribeAuthListener();
          unsubscribeUrlListener();
        };
      } catch (error) {
        console.error("App initialization error:", error);
        setIsLoading(false);
        setShowSplash(false);
      }
    }
    
    initializeApp();
  }, []);

  // Show splash screen
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#7e22ce" />
      </View>
    );
  }

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e22ce" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer linking={linking}>
          <StatusBar style="light" />
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            ) : !onboardingComplete ? (
              <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              <RootStack.Screen name="Main" component={MainNavigator} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
