import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { onAuthStateChanged, User, initializeAuth } from '../lib/auth';
import { H3 } from '../components/ui/Typography';
import { colors } from '../theme/colors';

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

// Custom header button
const HeaderBackButton = ({ onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 16 
    }}
  >
    <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
  </TouchableOpacity>
);

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
          iconName = 'dashboard';
        } else if (route.name === 'Recording') {
          iconName = focused ? 'mic' : 'mic-none';
        } else if (route.name === 'Transcripts') {
          iconName = 'list';
        } else if (route.name === 'Training') {
          iconName = 'school';
        } else if (route.name === 'Settings') {
          iconName = 'settings';
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.mutedForeground,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      headerStyle: {
        backgroundColor: colors.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTitleStyle: {
        fontWeight: '600',
      },
      headerTintColor: colors.foreground,
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ 
        headerShown: false,
      }}
    />
    <Tab.Screen 
      name="Recording" 
      component={RecordingScreen} 
      options={{ 
        headerShown: false,
      }}
    />
    <Tab.Screen 
      name="Transcripts" 
      component={AllTranscriptsScreen} 
      options={{ 
        headerShown: false,
      }}
    />
    <Tab.Screen 
      name="Training" 
      component={TrainingScreen} 
      options={{ 
        headerShown: false,
      }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ 
        headerShown: false,
      }}
    />
  </Tab.Navigator>
);

// Main navigator
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={({ navigation }) => ({
      headerStyle: {
        backgroundColor: colors.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      headerTitleStyle: {
        fontWeight: '600',
      },
      headerTintColor: colors.foreground,
      headerLeft: (props) => (
        <HeaderBackButton onPress={navigation.goBack} />
      ),
    })}
  >
    <MainStack.Screen 
      name="Tabs" 
      component={TabNavigator} 
      options={{ headerShown: false }}
    />
    <MainStack.Screen 
      name="TranscriptView" 
      component={TranscriptViewScreen}
      options={{ headerShown: false }}
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

  if (isLoading) {
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
