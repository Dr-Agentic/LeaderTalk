import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { getSupabase } from './supabaseAuth';
import { API_URL } from './api';
import { configureQueryClient } from './queryErrorHandler';

// IMPORTANT: This is the SINGLE QueryClient instance for the entire app
// DO NOT create another QueryClient in _layout.tsx or anywhere else
// All React Query operations must use this instance to avoid cache conflicts
export const queryClient = configureQueryClient(new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
}));

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

/**
 * Unified API request function with authentication
 * Supports both old and new signatures for backward compatibility
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<any>;
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response>;
export async function apiRequest(
  endpointOrMethod: string,
  endpointOrOptions?: string | RequestInit,
  data?: any,
  options: RequestInit = {}
): Promise<any> {
  let method: string;
  let endpoint: string;
  let requestOptions: RequestInit;
  let requestData: any;

  // Handle both function signatures
  if (typeof endpointOrOptions === 'string') {
    // Old signature: apiRequest(method, endpoint, data, options)
    method = endpointOrMethod;
    endpoint = endpointOrOptions;
    requestData = data;
    requestOptions = options;
  } else {
    // New signature: apiRequest(endpoint, options)
    method = 'GET';
    endpoint = endpointOrMethod;
    requestOptions = endpointOrOptions || {};
    requestData = requestOptions.body ? JSON.parse(requestOptions.body as string) : undefined;
    
    // Extract method from options if provided
    if (requestOptions.method) {
      method = requestOptions.method;
    }
  }

  try {
    // Get authentication token from Supabase
    const supabase = getSupabase();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error in API request:', sessionError);
      throw new Error('Authentication session error');
    }

    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${API_URL}${endpoint}`;
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-platform': Platform.OS, // ios | android | web
        ...requestOptions.headers,
      },
      credentials: 'include',
      ...requestOptions,
    };

    // Add body for non-GET requests
    if (requestData && method !== 'GET') {
      config.body = JSON.stringify(requestData);
    }

    console.log(`API Request: ${method} ${endpoint}`, requestData ? { data: requestData } : {});

    const response = await fetch(url, config);
    
    console.log(`API Response: ${method} ${endpoint} - Status: ${response.status}`);

    // Handle 401 Unauthorized by clearing session and redirecting
    if (response.status === 401) {
      console.warn('Unauthorized API request, signing out');
      await supabase.auth.signOut();
      // The auth state change will trigger navigation to login
      throw new Error('Authentication expired. Please log in again.');
    }
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    // For the new signature, return parsed JSON
    if (typeof endpointOrOptions !== 'string') {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    }

    // For the old signature, return the response object
    return response;
  } catch (error) {
    console.error(`API Error: ${method} ${endpoint}`, error);
    throw error;
  }
}

/**
 * Upload a file with form data and authentication
 */
export async function uploadFile(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Get authentication token from Supabase
    const supabase = getSupabase();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error in file upload:', sessionError);
      throw new Error('Authentication session error');
    }

    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${API_URL}${endpoint}`;
    
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      credentials: 'include',
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
        // Don't set Content-Type header for FormData - let the browser set it with boundary
      },
    };

    console.log(`File Upload: POST ${endpoint}`);

    const response = await fetch(url, config);
    
    console.log(`Upload Response: POST ${endpoint} - Status: ${response.status}`);

    // Handle 401 Unauthorized by clearing session
    if (response.status === 401) {
      console.warn('Unauthorized file upload request, signing out');
      await supabase.auth.signOut();
      throw new Error('Authentication expired. Please log in again.');
    }
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    console.error(`Upload Error: POST ${endpoint}`, error);
    throw error;
  }
}
