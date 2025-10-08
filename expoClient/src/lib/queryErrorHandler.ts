import { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

/**
 * Global error handler for React Query
 * Handles 401 responses by redirecting to login
 */
export function _handleQueryError(error: unknown) {
  console.error('React Query error:', error);
  
  // Check if error is a fetch response error
  if (error instanceof Error && error.message.includes('401')) {
    console.log('🔐 401 error detected, redirecting to login');
    router.replace('/login');
    return;
  }
  
  // Check for network errors that might indicate auth issues
  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    console.warn('🌐 Network error detected:', error.message);
    // Don't redirect on network errors - could be temporary
    return;
  }
}

/**
 * Configure QueryClient with global error handling
 */
export function configureQueryClient(queryClient: QueryClient) {
  queryClient.setDefaultOptions({
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 401 errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      onError: _handleQueryError,
    },
    mutations: {
      onError: _handleQueryError,
    },
  });
  
  return queryClient;
}
