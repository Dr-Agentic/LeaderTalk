import { QueryClient } from '@tanstack/react-query';
import { getSupabase } from '../supabase';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Base API URL - get from environment or use default
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// Check if the user has an active session
export async function checkSession(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    console.error('Session check exception:', error);
    return false;
  }
}

// Helper function to make API requests with authentication
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  body?: any,
  customHeaders?: Record<string, string>
): Promise<Response> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...customHeaders,
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);

    // Handle 401 Unauthorized by clearing session
    if (response.status === 401) {
      console.warn('Unauthorized API request, signing out');
      await supabase.auth.signOut();
      // In a real app, you might want to navigate to the login screen here
    }

    return response;
  } catch (error) {
    console.error(`API request error (${method} ${endpoint}):`, error);
    throw error;
  }
}
