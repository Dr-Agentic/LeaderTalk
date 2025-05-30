import { supabase } from '../supabase'
import { User } from '@supabase/supabase-js'
// Debug logging replaced with console methods

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

// Convert Supabase user to our AuthUser format for compatibility
function convertSupabaseUser(user: User): AuthUser {
  return {
    uid: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || null,
    photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    emailVerified: user.email_confirmed_at !== null
  }
}

// Sign in with Google - this will work properly on Safari and iOS
export async function signInWithGoogle(): Promise<AuthUser | null> {
  try {
    console.log("Starting Supabase Google authentication")

    const redirectUrl = window.location.origin + '/auth/callback'
    console.log("Supabase OAuth redirect URL:", redirectUrl)
    console.log("Current window location:", {
      origin: window.location.origin,
      href: window.location.href,
      host: window.location.host
    })
    
    // Wait 5 seconds to allow reading the logs
    console.log("Waiting 5 seconds for log review...")
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log("Proceeding with authentication...")

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      console.error("Supabase Google authentication failed", error)
      throw new Error(`Authentication failed: ${error.message}`)
    }

    console.log("Supabase Google authentication initiated successfully")
    
    // Force redirect using multiple methods to ensure it works across browsers
    if (data.url) {
      console.log("Redirecting to OAuth URL")
      
      // Try different redirect methods for better browser compatibility
      try {
        window.location.assign(data.url)
      } catch (e) {
        try {
          window.location.replace(data.url)
        } catch (e2) {
          window.location.href = data.url
        }
      }
    }
    
    return null // User will be available after redirect
  } catch (error: any) {
    console.error("Google sign-in error", error)
    throw error
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Failed to get current user", error)
      return null
    }
    return user ? convertSupabaseUser(user) : null
  } catch (error: any) {
    console.error("Get current user error", error)
    return null
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error", error)
      throw error
    }
    console.log("User signed out successfully")
  } catch (error: any) {
    console.error("Sign out failed", error)
    throw error
  }
}

// Auth state change listener
export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log("Auth state changed", { event, hasSession: !!session })
      const user = session?.user ? convertSupabaseUser(session.user) : null
      callback(user)
    }
  )

  return () => {
    subscription.unsubscribe()
  }
}

// Handle auth callback after OAuth redirect
export async function handleAuthCallback(): Promise<AuthUser | null> {
  try {
    console.log("Handling auth callback", {
      url: window.location.href,
      hash: window.location.hash,
      search: window.location.search
    })

    // Get session from URL hash or search params
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Auth callback error", error)
      throw error
    }

    if (data.session) {
      console.log("Auth callback successful", {
        userId: data.session.user.id,
        email: data.session.user.email
      })
      return convertSupabaseUser(data.session.user)
    }

    console.log("No session found in auth callback")
    return null
  } catch (error: any) {
    console.error("Auth callback handling failed", error)
    throw error
  }
}

// Get session token for server authentication
export async function getSessionToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error("Failed to get session token", error)
    return null
  }

  return session?.access_token || null
}