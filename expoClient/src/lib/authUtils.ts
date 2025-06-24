import { getSupabase } from './supabaseAuth';

/**
 * Clear all authentication data and redirect to login
 * Useful for testing and debugging
 */
export async function clearAuthAndRedirect() {
  try {
    const supabase = getSupabase();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear any local storage
    // Note: In React Native, AsyncStorage would be used instead of localStorage
    console.log('🔐 Authentication cleared');
    
    return true;
  } catch (error) {
    console.error('🔐 Error clearing auth:', error);
    return false;
  }
}

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('🔐 Auth check error:', error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('🔐 Error checking auth:', error);
    return false;
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('🔐 Error getting session:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('🔐 Error getting session:', error);
    return null;
  }
}
