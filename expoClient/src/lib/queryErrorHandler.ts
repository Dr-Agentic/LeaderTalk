import { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

/**
 * Global error handler for React Query
 * Handles 401 responses by redirecting to login silently
 */
export function _handleQueryError(error: unknown) {
  // Check if error is a 401 response
  if (error instanceof Error && error.message.includes('401')) {
    console.log('🔐 401 error detected - AuthContext will handle redirect');
    // Don't show alerts or redirect here - let AuthContext handle it
    return;
  }
  
  // Log other errors for debugging
  if (__DEV__) {
    console.error('React Query error:', error);
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
