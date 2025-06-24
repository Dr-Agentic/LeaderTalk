import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fetchAuthParameters, sendAuthCallback } from './api';

// Create a platform-specific storage implementation
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    };
  } else {
    // Use SecureStore for native platforms
    return {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
      },
    };
  }
};

const storageAdapter = createStorageAdapter();

// We'll use a placeholder URL and key initially to avoid the "required" error
// These will be replaced when initializeSupabase is called
let supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key', {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Determine if we're in development mode
const isDevelopment = Constants.expoConfig?.packagerOpts?.dev === true;

// URL to redirect back to your app after authentication
const getRedirectTo = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'http://localhost:8081/auth/callback'; // fallback for SSR
  }
  return 'exp://localhost:8081/--/auth/callback';
};

export const redirectTo = getRedirectTo();

// Store the code verifier for PKCE
let codeVerifier: string | null = null;

// Log the redirect URL for debugging
console.log('Redirect URL:', redirectTo);

// Initialize Supabase with parameters from the server
export async function initializeSupabase() {
  try {
    const params = await fetchAuthParameters();
    
    if (!params.supabaseUrl || !params.supabaseAnonKey) {
      throw new Error('Invalid Supabase parameters received from server');
    }
    
    // Create a new client with the fetched parameters
    supabase = createClient(params.supabaseUrl, params.supabaseAnonKey, {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
    
    console.log('Supabase client initialized with server parameters');
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

// Get the initialized Supabase client
export function getSupabase() {
  return supabase;
}

// Platform-specific secure storage functions
const secureStorage = {
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  deleteItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Sign in with Google
export async function signInWithGoogle() {
  try {
    console.log('Starting Google sign-in process');
    
    // Make sure Supabase is initialized with server parameters
    await initializeSupabase();
    
    if (Platform.OS === 'web') {
      // For web, use the simpler OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectTo(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            theme: 'dark',
          },
        },
      });

      if (error) {
        console.error('Error with web OAuth:', error);
        throw error;
      }

      return { success: true };
    } else {
      // Native mobile flow (existing code)
      // Register a URL event listener before starting the auth flow
      const subscription = Linking.addEventListener('url', ({ url }) => {
        console.log('Deep link received:', url);
        // We don't need to handle the URL here as Expo Router will do it
      });
      
      // Create the sign-in URL with PKCE and dark theme
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectTo(),
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            theme: 'dark',
          },
          // PKCE is enabled by default in Supabase v2
        },
      });

      if (error) {
        console.error('Error creating sign-in URL:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('No URL returned from signInWithOAuth');
        throw new Error('No URL returned from signInWithOAuth');
      }

      // Store the code verifier for later use
      if (data.verifier) {
        codeVerifier = data.verifier;
        console.log('Code verifier generated and stored');
        
        // Store in secure storage for persistence across app restarts
        await secureStorage.setItem('supabase_code_verifier', data.verifier);
      } else {
        console.warn('No code verifier returned from signInWithOAuth');
      }

      console.log('Opening browser for authentication with URL:', data.url);
      console.log('Redirect URL is:', getRedirectTo());
      
      // Open the URL in the browser
      try {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          getRedirectTo()
        );
        
        console.log('Browser auth result:', result);

        // Remove the event listener
        subscription.remove();

        if (result.type === 'success') {
          // The auth callback route will handle the code exchange
          console.log('Auth browser session completed successfully');
          return { success: true };
        } else {
          console.log('Auth was cancelled or failed:', result.type);
          throw new Error(`Authentication cancelled or failed: ${result.type}`);
        }
      } catch (browserError) {
        console.error('Error opening browser:', browserError);
        throw new Error(`Failed to open authentication browser: ${browserError}`);
      }
    }
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    throw error;
  }
}

// Exchange code for session (used in auth/callback.tsx)
export async function exchangeCodeForSession(code: string) {
  try {
    console.log('Exchanging code for session');
    
    // Retrieve the code verifier from storage
    let verifier = codeVerifier;
    
    if (!verifier) {
      // Try to get it from secure storage if not in memory
      verifier = await secureStorage.getItem('supabase_code_verifier');
      console.log('Retrieved code verifier from storage');
    }
    
    if (!verifier) {
      console.error('No code verifier found for PKCE flow');
      throw new Error('Authentication failed: No code verifier found');
    }
    
    // Exchange the code for a session using the code verifier
    const { data, error } = await supabase.auth.exchangeCodeForSession(code, verifier);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      throw error;
    }
    
    if (!data.session) {
      throw new Error('No session returned from code exchange');
    }
    
    console.log('Successfully exchanged code for session');
    
    // Clear the code verifier after use
    codeVerifier = null;
    await secureStorage.deleteItem('supabase_code_verifier');
    
    return data;
  } catch (error) {
    console.error('Error in exchangeCodeForSession:', error);
    throw error;
  }
}

// Sign out
export async function signOut() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out from Supabase:', error);
    }
    
    // Also sign out from our server
    await import('./api').then(api => api.logout());
    
    console.log('Successfully signed out');
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
}
