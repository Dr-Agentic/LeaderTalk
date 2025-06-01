import { getSupabase } from "../supabase";
import { User } from "@supabase/supabase-js";
// Debug logging replaced with console methods

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

// Sign in with Google - this will work properly on Safari and iOS
export async function signInWithGoogle(): Promise<AuthUser | null> {
  try {
    console.log("Starting Supabase Google authentication");

    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
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

    // Force redirect using multiple methods to ensure it works across browsers
    if (data.url) {
      console.log("Redirecting to OAuth URL");

      // Try different redirect methods for better browser compatibility
      try {
        window.location.assign(data.url);
      } catch (e) {
        try {
          window.location.replace(data.url);
        } catch (e2) {
          window.location.href = data.url;
        }
      }
    }

    return null; // User will be available after redirect
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
    } = await supabase.auth.getUser();
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
    const { error } = await supabase.auth.signOut();
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
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed", { event, hasSession: !!session });
    const user = session?.user ? convertSupabaseUser(session.user) : null;
    callback(user);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// Handle auth callback after OAuth redirect
export async function handleAuthCallback(): Promise<AuthUser | null> {
  try {
    console.log("Handling auth callback", {
      url: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
    });

    // First check if there's already a session (most reliable approach)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      console.log("Auth callback successful via existing session", {
        userId: sessionData.session.user.id,
        email: sessionData.session.user.email,
      });
      return convertSupabaseUser(sessionData.session.user);
    }

    // If no session and we have URL parameters, try manual parsing
    if (window.location.search || window.location.hash) {
      console.error(
        "No existing session, triggering auth state change detection",
      );

      // Return null and let the auth state listener handle it
      // This approach is more reliable than manual URL parsing
      return null;
    }

    console.error("No session found in auth callback");
    return null;
  } catch (error: any) {
    console.error("Auth callback handling failed", error);
    throw error;
  }
}

// Get session token for server authentication
export async function getSessionToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to get session token", error);
    return null;
  }

  return session?.access_token || null;
}
