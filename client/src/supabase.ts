import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Global Supabase client instance
let supabaseClient: SupabaseClient | null = null

// Initialize Supabase client with server-provided configuration
export async function initializeSupabase(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient
  }

  try {
    const response = await fetch('/api/auth/auth-parameters')
    if (!response.ok) {
      throw new Error(`Failed to fetch auth parameters: ${response.status}`)
    }

    const { supabaseUrl, supabaseAnonKey, environment } = await response.json()
    console.log(`Initializing Supabase for ${environment} environment`)

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  } catch (error) {
    console.error('Failed to initialize Supabase:', error)
    throw error
  }
}

// Export getter function that ensures initialization
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.')
  }
  return supabaseClient
}

// For backward compatibility, export as supabase (will be initialized by App component)
export let supabase: SupabaseClient