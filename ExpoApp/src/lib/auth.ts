// Authentication module for the LeaderTalk app
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';
import { logInfo, logError, logDebug, logWarn } from './debugLogger';

// Ensure WebBrowser redirects work properly
WebBrowser.maybeCompleteAuthSession();

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  googleId?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  profession?: string;
  goals?: string;
  selectedLeaders?: number[];
  isOnboarded?: boolean;
}

// Auth state
let currentUser: User | null = null;
let authListeners: ((user: User | null) => void)[] = [];

// Google Auth configuration
const googleConfig = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

// Initialize Google Auth
export async function initializeAuth() {
  try {
    logDebug("Initializing auth", { platform: Platform.OS });
    
    // Check if we have a stored user
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      logInfo("Loaded stored user", { userId: currentUser?.id });
      
      // Notify listeners
      authListeners.forEach(listener => listener(currentUser));
    }
    
    return true;
  } catch (error: any) {
    logError("Error initializing auth", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace"
    });
    return false;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  try {
    logDebug("Signing in with email", { email });
    
    const user = await apiRequest<User>('POST', '/api/auth/login', {
      email,
      password
    });
    
    // Store user in memory and AsyncStorage
    currentUser = user;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    // Notify listeners
    authListeners.forEach(listener => listener(user));
    
    logInfo("User signed in successfully", { userId: user.id });
    return user;
  } catch (error: any) {
    logError("Sign in failed", {
      email,
      message: error?.message || "Unknown error"
    });
    throw error;
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User | null> {
  try {
    logDebug("Starting Google sign in", { platform: Platform.OS });
    
    // Create Google auth request
    const [request, response, promptAsync] = Google.useAuthRequest({
      expoClientId: googleConfig.expoClientId,
      iosClientId: googleConfig.iosClientId,
      androidClientId: googleConfig.androidClientId,
      webClientId: googleConfig.webClientId,
    });
    
    // Start Google auth flow
    const result = await promptAsync();
    
    if (result.type === 'success') {
      // Get user info from Google
      const { authentication } = result;
      
      // Exchange Google token for our own session
      const user = await apiRequest<User>('POST', '/api/auth/google', {
        idToken: authentication?.idToken,
      });
      
      // Store user in memory and AsyncStorage
      currentUser = user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Notify listeners
      authListeners.forEach(listener => listener(user));
      
      logInfo("User signed in with Google successfully", { userId: user.id });
      return user;
    } else {
      logWarn("Google sign in was cancelled or failed", { resultType: result.type });
      return null;
    }
  } catch (error: any) {
    logError("Google sign in failed", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace"
    });
    throw error;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    logDebug("Signing out user", { userId: currentUser?.id });
    
    // Call API to invalidate session
    await apiRequest('POST', '/api/auth/logout', {});
    
    // Clear user from memory and AsyncStorage
    currentUser = null;
    await AsyncStorage.removeItem('user');
    
    // Notify listeners
    authListeners.forEach(listener => listener(null));
    
    logInfo("User signed out successfully");
  } catch (error: any) {
    logError("Sign out failed", {
      message: error?.message || "Unknown error"
    });
    throw error;
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return currentUser;
}

// Add auth state change listener
export function onAuthStateChanged(listener: (user: User | null) => void): () => void {
  authListeners.push(listener);
  
  // Call immediately with current state
  listener(currentUser);
  
  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(l => l !== listener);
  };
}

// Demo login for development
export async function demoLogin(): Promise<User> {
  try {
    logDebug("Using demo login");
    
    const user = await apiRequest<User>('POST', '/api/auth/demo-login', {});
    
    // Store user in memory and AsyncStorage
    currentUser = user;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    // Notify listeners
    authListeners.forEach(listener => listener(user));
    
    logInfo("Demo login successful", { userId: user.id });
    return user;
  } catch (error: any) {
    logError("Demo login failed", {
      message: error?.message || "Unknown error"
    });
    throw error;
  }
}
