import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
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
    return 'https://app.leadertalk.app/auth/callback';
  }
  return 'leadertalk://auth/callback';
};

export const redirectTo = getRedirectTo();

// Store the code verifier for PKCE (no longer needed for implicit flow)
// let codeVerifier: string | null = null;

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

// Platform-specific secure storage functions (simplified, no longer needed for PKCE)
// const secureStorage = {
//   setItem: async (key: string, value: string) => {
//     if (Platform.OS === 'web') {
//       if (typeof window !== 'undefined' && window.localStorage) {
//         window.localStorage.setItem(key, value);
//       }
//     } else {
//       await SecureStore.setItemAsync(key, value);
//     }
//   },
//   getItem: async (key: string) => {
//     if (Platform.OS === 'web') {
//       if (typeof window !== 'undefined' && window.localStorage) {
//         return window.localStorage.getItem(key);
//       }
//       return null;
//     } else {
//       return await SecureStore.getItemAsync(key);
//     }
//   },
//   deleteItem: async (key: string) => {
//     if (Platform.OS === 'web') {
//       if (typeof window !== 'undefined' && window.localStorage) {
//         window.localStorage.removeItem(key);
//       }
//     } else {
//       await SecureStore.deleteItemAsync(key);
//     }
//   },
// };

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
      // Native mobile flow
      // Create the sign-in URL for implicit flow
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
        console.error('Error creating sign-in URL:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('No URL returned from signInWithOAuth');
        throw new Error('No URL returned from signInWithOAuth');
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

        if (result.type === 'success' && result.url) {
          console.log('Auth browser session completed successfully');
          
          // Process tokens directly from the returned URL
          console.log('Processing tokens directly from browser result');
          try {
            const { session } = await setSessionFromTokens(result.url);
            
            if (!session) {
              throw new Error('No session returned from token setup');
            }
            
            console.log('Successfully authenticated with Supabase');
            
            // Get user data from Supabase session
            const { user } = session;
            
            if (!user) {
              throw new Error('No user data in session');
            }
            
            // Send auth data to our server to create/update user and establish session
            console.log('Syncing with server...');
            try {
              await sendAuthCallback({
                uid: user.id,
                email: user.email || '',
                displayName: user.user_metadata?.full_name,
                photoURL: user.user_metadata?.avatar_url,
                emailVerified: user.email_confirmed_at ? true : false,
              });
              
              console.log('Server sync complete, navigating to dashboard');
              
              // Navigate directly to dashboard - no deeplink needed
              router.replace('/dashboard');
              
            } catch (serverError) {
              console.error('Error syncing with server:', serverError);
              // Even if server sync fails, we can still proceed with Supabase auth
              console.log('Server sync failed but proceeding to dashboard');
              router.replace('/dashboard');
            }
            
            return { success: true };
            
          } catch (tokenError) {
            console.error('Error processing tokens:', tokenError);
            throw new Error(`Token processing failed: ${tokenError.message}`);
          }
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

// Parse tokens from URL fragment (implicit flow)
function parseTokensFromFragment(url: string): {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  expires_in?: string;
} | null {
  try {
    console.log('🔗 Parsing tokens from URL:', url);
    
    // Extract fragment part after #
    const fragmentIndex = url.indexOf('#');
    if (fragmentIndex === -1) {
      console.log('🔗 No fragment found in URL');
      return null;
    }
    
    const fragment = url.substring(fragmentIndex + 1);
    console.log('🔗 URL fragment:', fragment);
    
    // Parse fragment as URL parameters
    const params = new URLSearchParams(fragment);
    const tokens = {
      access_token: params.get('access_token') || undefined,
      refresh_token: params.get('refresh_token') || undefined,
      expires_at: params.get('expires_at') || undefined,
      expires_in: params.get('expires_in') || undefined,
    };
    
    console.log('🔗 Parsed tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresAt: tokens.expires_at,
      expiresIn: tokens.expires_in,
    });
    
    return tokens.access_token ? tokens : null;
  } catch (error) {
    console.error('🔗 Error parsing tokens from fragment:', error);
    return null;
  }
}

// Set session using tokens from implicit flow
export async function setSessionFromTokens(url: string) {
  try {
    console.log('🔗 Setting session from tokens in URL');
    
    const tokens = parseTokensFromFragment(url);
    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      throw new Error('No valid tokens found in URL');
    }
    
    // Calculate expires_at if we have expires_in
    let expiresAt = tokens.expires_at;
    if (!expiresAt && tokens.expires_in) {
      const expiresInSeconds = parseInt(tokens.expires_in);
      expiresAt = Math.floor(Date.now() / 1000 + expiresInSeconds).toString();
    }
    
    // Set the session using the tokens
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    
    if (error) {
      console.error('🔗 Error setting session:', error);
      throw error;
    }
    
    if (!data.session) {
      throw new Error('No session returned from setSession');
    }
    
    console.log('🔗 Successfully set session from tokens');
    return data;
  } catch (error) {
    console.error('🔗 Error in setSessionFromTokens:', error);
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
