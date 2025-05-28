// Simple authentication service
import AsyncStorage from '@react-native-async-storage/async-storage';

// User type
export interface User {
  uid: string;
  email: string;
  displayName: string;
}

// Auth state management
let currentUser: User | null = null;
type AuthStateListener = (user: User | null) => void;
const listeners: AuthStateListener[] = [];

// Initialize auth state from storage
export const initializeAuth = async (): Promise<void> => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      currentUser = JSON.parse(userData);
      notifyListeners();
    }
  } catch (error) {
    console.error('Failed to initialize auth:', error);
  }
};

// Sign in function
export const signIn = async (email: string, password: string): Promise<User> => {
  // In a real app, you would validate credentials against a backend
  // For now, we'll accept any non-empty credentials
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Create a user object
  const user: User = {
    uid: `user-${Date.now()}`,
    email,
    displayName: email.split('@')[0]
  };
  
  // Store user in memory and persistent storage
  currentUser = user;
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  // Notify listeners
  notifyListeners();
  return user;
};

// Sign out function
export const signOut = async (): Promise<void> => {
  currentUser = null;
  await AsyncStorage.removeItem('user');
  notifyListeners();
};

// Get current user function
export const getCurrentUser = (): User | null => {
  return currentUser;
};

// Auth state change listener
export const onAuthStateChanged = (callback: AuthStateListener): (() => void) => {
  listeners.push(callback);
  // Call immediately with current state
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify listeners when auth state changes
const notifyListeners = () => {
  listeners.forEach(listener => listener(currentUser));
};
