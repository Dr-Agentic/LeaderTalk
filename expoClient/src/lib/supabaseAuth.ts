import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { fetchAuthParameters, sendAuthCallback } from './api';

// Create a custom storage implementation using SecureStore
const ExpoSecureStoreAdapter = {
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

// We'll use a placeholder URL and key initially to avoid the "required" error
// These will be replaced when initializeSupabase is called
let supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key', {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// URL to redirect back to your app after authentication
export const redirectTo = makeRedirectUri({
  scheme: 'leadertalk',
  path: 'auth/callback',
});

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
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
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

// Sign in with Google
export async function signInWithGoogle() {
  try {
    console.log('Starting Google sign-in process');
    
    // Make sure Supabase is initialized with server parameters
    await initializeSupabase();
    
    // Create the sign-in URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
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

    console.log('Opening browser for authentication');
    
    // Open the URL in the browser
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    if (result.type === 'success') {
      const { url } = result;
      console.log('Auth successful, processing redirect URL');
      
      // Extract the tokens from the URL
      const params = QueryParams.getQueryParams(url);
      
      // Exchange the code for a session
      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          throw error;
        }
        
        console.log('Successfully signed in with Google');
        
        // Get user data from Supabase session
        const { user } = data.session;
        
        if (!user) {
          throw new Error('No user data in session');
        }
        
        // Send auth data to our server to create/update user and establish session
        await sendAuthCallback({
          uid: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.full_name,
          photoURL: user.user_metadata?.avatar_url,
          emailVerified: user.email_confirmed_at ? true : false,
        });
        
        return data;
      }
    } else {
      console.log('Auth was cancelled or failed:', result.type);
    }
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
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
