import { getSupabase } from './supabaseAuth';

// Demo user credentials
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'ex!=amplE//0618';

/**
 * Sign in with demo account using Supabase password authentication
 * This ensures proper session management and persistence
 */
export async function signInWithDemo() {
  try {
    console.log('Starting demo sign-in process');
    
    // Get the initialized Supabase client
    const supabase = getSupabase();
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });

    if (error) {
      console.error('Demo login error:', error);
      throw error;
    }
    
    if (!data.session) {
      throw new Error('No session returned from demo login');
    }
    
    console.log('Demo login successful, session established');
    return data;
  } catch (error) {
    console.error('Error in demo login:', error);
    throw error;
  }
}
