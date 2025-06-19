import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global Supabase client instance
let supabaseClient: SupabaseClient | null = null;

// Initialize Supabase client with server-provided configuration
export async function initializeSupabase(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    // For mobile, we need to fetch the auth parameters from the server
    const response = await fetch('https://app.leadertalk.app/api/auth/auth-parameters');
    if (!response.ok) {
      throw new Error(`Failed to fetch auth parameters: ${response.status}`);
    }

    const { supabaseUrl, supabaseAnonKey, environment } = await response.json();
    console.log(`Initializing Supabase for ${environment} environment`);

    // Create Supabase client with AsyncStorage for mobile
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      }
    });
    
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

// Export getter function that ensures initialization
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.');
  }
  return supabaseClient;
}

// For backward compatibility, export as supabase (will be initialized by App component)
export let supabase: SupabaseClient;
