import { supabase } from '../supabase'
import { User } from '@supabase/supabase-js'
import { logInfo, logError, logDebug } from '@/lib/debugLogger'

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
    logDebug("Starting Supabase Google authentication", {
      currentUrl: window.location.href,
      userAgent: navigator.userAgent
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      logError("Supabase Google authentication failed", error)
      throw new Error(`Authentication failed: ${error.message}`)
    }

    logInfo("Supabase Google authentication initiated successfully")
    logDebug("OAuth data received", { url: data.url, provider: data.provider })
    
    // The signInWithOAuth should automatically redirect, but if it doesn't, manually redirect
    if (data.url) {
      logDebug("Manually redirecting to OAuth URL", { url: data.url })
      window.location.href = data.url
    }
    
    return null // User will be available after redirect
  } catch (error: any) {
    logError("Google sign-in error", error)
    throw error
  }
}

// Get current user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      logError("Failed to get current user", error)
      return null
    }
    return user ? convertSupabaseUser(user) : null
  } catch (error: any) {
    logError("Get current user error", error)
    return null
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      logError("Sign out error", error)
      throw error
    }
    logInfo("User signed out successfully")
  } catch (error: any) {
    logError("Sign out failed", error)
    throw error
  }
}

// Auth state change listener
export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      logDebug("Auth state changed", { event, hasSession: !!session })
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
    logDebug("Handling auth callback", {
      url: window.location.href,
      hash: window.location.hash,
      search: window.location.search
    })

    // Get session from URL hash or search params
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      logError("Auth callback error", error)
      throw error
    }

    if (data.session) {
      logInfo("Auth callback successful", {
        userId: data.session.user.id,
        email: data.session.user.email
      })
      return convertSupabaseUser(data.session.user)
    }

    logDebug("No session found in auth callback")
    return null
  } catch (error: any) {
    logError("Auth callback handling failed", error)
    throw error
  }
}

// Get session token for server authentication
export async function getSessionToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    logError("Failed to get session token", error)
    return null
  }

  return session?.access_token || null
}