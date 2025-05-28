import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, User, initializeAuth } from '../lib/auth';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RecordingScreen from '../screens/RecordingScreen';
import TranscriptViewScreen from '../screens/TranscriptViewScreen';
import AllTranscriptsScreen from '../screens/AllTranscriptsScreen';
import TrainingScreen from '../screens/TrainingScreen';
import SettingsScreen from '../screens/SettingsScreen';

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
  Tabs: undefined;
  TranscriptView: { id: number };
  ModuleView: { moduleId: number, chapterId: number };
  SituationView: { id: number, moduleId: number, chapterId: number };
};

type TabParamList = {
  Dashboard: undefined;
  Recording: undefined;
  Transcripts: undefined;
  Training: undefined;
  Settings: undefined;
};

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Auth navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// Tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof MaterialIcons.glyphMap = 'home';

        if (route.name === 'Dashboard') {
          iconName = focused ? 'dashboard' : 'dashboard';
        } else if (route.name === 'Recording') {
          iconName = focused ? 'mic' : 'mic-none';
        } else if (route.name === 'Transcripts') {
          iconName = focused ? 'list' : 'list';
        } else if (route.name === 'Training') {
          iconName = focused ? 'school' : 'school';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#e53e3e',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Recording" component={RecordingScreen} />
    <Tab.Screen name="Transcripts" component={AllTranscriptsScreen} />
    <Tab.Screen name="Training" component={TrainingScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

// Main navigator
const MainNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen 
      name="Tabs" 
      component={TabNavigator} 
      options={{ headerShown: false }}
    />
    <MainStack.Screen 
      name="TranscriptView" 
      component={TranscriptViewScreen}
      options={{ title: 'Transcript' }}
    />
    <MainStack.Screen 
      name="ModuleView" 
      component={ModuleViewScreen}
      options={{ title: 'Module' }}
    />
    <MainStack.Screen 
      name="SituationView" 
      component={SituationViewScreen}
      options={{ title: 'Situation' }}
    />
  </MainStack.Navigator>
);

// Placeholder for screens not yet implemented
const ModuleViewScreen = () => <View />;
const SituationViewScreen = () => <View />;

// Root navigator
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e53e3e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
  );
}
