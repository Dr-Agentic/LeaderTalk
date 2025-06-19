import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// Custom storage implementation for Expo using SecureStore
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

// Global Supabase client instance
let supabaseClient: SupabaseClient | null = null;

// Initialize Supabase client with server-provided configuration
export async function initializeSupabase(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    // Fetch auth parameters from the server API
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/auth/auth-parameters`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch auth parameters: ${response.status}`);
    }

    const { supabaseUrl, supabaseAnonKey, environment } = await response.json();
    console.log(`Initializing Supabase for ${environment} environment`);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL or anon key is missing from server response');
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
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
