import { createClient } from '@supabase/supabase-js'

// Use centralized environment configuration with PROD_ prefix support
function getClientConfigValue(key: string): string | undefined {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // Try PROD_ prefixed version first, fallback to regular version
    return import.meta.env[`VITE_PROD_${key}`] || import.meta.env[`VITE_${key}`];
  }
  
  // Development: use regular version
  return import.meta.env[`VITE_${key}`];
}

const supabaseUrl = getClientConfigValue('SUPABASE_URL')
const supabaseAnonKey = getClientConfigValue('SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')