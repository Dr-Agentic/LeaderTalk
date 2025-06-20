import { getSupabase } from "../supabase";
import { User } from "@supabase/supabase-js";
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// Convert Supabase user to our AuthUser format for compatibility
function convertSupabaseUser(user: User): AuthUser {
  return {
    uid: user.id,
    email: user.email || null,
    displayName:
      user.user_metadata?.full_name || user.user_metadata?.name || null,
    photoURL:
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    emailVerified: user.email_confirmed_at !== null,
  };
}

// Get the redirect URL for OAuth
function getRedirectUri() {
  // Use Expo's helper to create a redirect URI that works with the current platform
  return makeRedirectUri({
    scheme: 'leadertalk', // This should match the scheme in app.json
    path: 'auth/callback',
  });
}

// Sign in with Google - mobile version
export async function signInWithGoogle(): Promise<AuthUser | null> {
  try {
    console.log("Starting Supabase Google authentication for mobile");
    
    // Get the redirect URL
    const redirectUri = getRedirectUri();
    console.log("Using redirect URI:", redirectUri);

    // Start the OAuth flow
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Supabase Google authentication failed", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    console.log("Supabase Google authentication initiated successfully");

    // Open the authentication URL in a browser
    if (data.url) {
      console.log("Opening OAuth URL in browser", data.url);
      
      // Use WebBrowser to handle the OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );
      
      if (result.type === 'success') {
        // The user was redirected back to our app
        console.log("Auth session completed successfully");
        
        // Extract the URL parameters
        const { url } = result;
        
        // Handle the URL - Supabase will automatically process this
        // if detectSessionInUrl is enabled in the Supabase client
        if (url) {
          console.log("Processing auth callback URL");
          const { data, error } = await getSupabase().auth.getSession();
          
          if (error) {
            console.error("Failed to get session after redirect", error);
            return null;
          }
          
          if (data.session) {
            console.log("Successfully authenticated user");
            return convertSupabaseUser(data.session.user);
          }
        }
      } else {
        console.log("Auth session was dismissed or failed", result.type);
      }
    }

    return null;
  } catch (error: any) {
    console.error("Google sign-in error", error);
    throw error;
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
      error,
    } = await getSupabase().auth.getUser();
    if (error) {
      console.error("Failed to get current user", error);
      return null;
    }
    return user ? convertSupabaseUser(user) : null;
  } catch (error: any) {
    console.error("Get current user error", error);
    return null;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      console.error("Sign out error", error);
      throw error;
    }
    console.log("User signed out successfully");
  } catch (error: any) {
    console.error("Sign out failed", error);
    throw error;
  }
}

// Auth state change listener
export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void,
): () => void {
  const {
    data: { subscription },
  } = getSupabase().auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed", { event, hasSession: !!session });
    const user = session?.user ? convertSupabaseUser(session.user) : null;
    callback(user);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Set up URL handling for auth callbacks
export function setupAuthUrlListener() {
  // Set up a listener for incoming links
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    console.log('Received URL:', url);
    
    if (url.includes('auth/callback')) {
      console.log('Processing auth callback URL');
      
      // Let Supabase handle the URL
      const { error } = await getSupabase().auth.getSession();
      
      if (error) {
        console.error('Error processing auth URL:', error);
      }
    }
  });
  
  return () => {
    subscription.remove();
  };
}

// Get session token for server authentication
export async function getSessionToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await getSupabase().auth.getSession();

  if (error) {
    console.error("Failed to get session token", error);
    return null;
  }

  return session?.access_token || null;
}
