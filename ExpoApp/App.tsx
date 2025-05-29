import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadFonts } from './src/utils/fontLoader';
import { colors } from './src/theme/colors';
import { onAuthStateChanged, User, initializeAuth } from './src/lib/auth';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RecordingScreen from './src/screens/RecordingScreen';
import TranscriptViewScreen from './src/screens/TranscriptViewScreen';
import AllTranscriptsScreen from './src/screens/AllTranscriptsScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Load fonts
  useEffect(() => {
    async function loadAppFonts() {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Continue without custom fonts if loading fails
        setFontsLoaded(true);
      }
    }

    loadAppFonts();
  }, []);

  // Initialize auth and check authentication status
  useEffect(() => {
    // Initialize auth first
    const init = async () => {
      await initializeAuth();
      setIsLoading(false);
    };
    
    init();
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      
      // For demo purposes, we'll consider onboarding complete if user is authenticated
      if (currentUser) {
        setOnboardingComplete(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
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
