import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getSupabase } from '../lib/supabaseAuth';
import { router } from 'expo-router';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const _updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const _checkAuthStatus = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        _updateAuthState({
          isAuthenticated: false,
          user: null,
          error: error.message,
          isLoading: false,
        });
        return;
      }

      const isAuthenticated = !!data.session?.user;
      _updateAuthState({
        isAuthenticated,
        user: data.session?.user || null,
        error: null,
        isLoading: false,
      });

      // Redirect based on auth state
      if (!isAuthenticated && router.canGoBack()) {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      _updateAuthState({
        isAuthenticated: false,
        user: null,
        error: (error as Error).message,
        isLoading: false,
      });
    }
  }, [_updateAuthState]);

  const signOut = useCallback(async () => {
    try {
      _updateAuthState({ isLoading: true });
      
      const supabase = getSupabase();
      await supabase.auth.signOut();
      
      // Also sign out from server
      try {
        const { logout } = await import('../lib/api');
        await logout();
      } catch (serverError) {
        console.warn('Server logout failed:', serverError);
      }
      
      _updateAuthState({
        isAuthenticated: false,
        user: null,
        error: null,
        isLoading: false,
      });
      
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      _updateAuthState({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  }, [_updateAuthState]);

  const refreshAuth = useCallback(async () => {
    _updateAuthState({ isLoading: true });
    await _checkAuthStatus();
  }, [_checkAuthStatus, _updateAuthState]);

  // Initialize auth state and listen for changes
  useEffect(() => {
    const supabase = getSupabase();
    
    // Initial auth check
    _checkAuthStatus();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_OUT' || !session) {
          _updateAuthState({
            isAuthenticated: false,
            user: null,
            error: null,
            isLoading: false,
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          _updateAuthState({
            isAuthenticated: true,
            user: session.user,
            error: null,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [_checkAuthStatus, _updateAuthState]);

  const contextValue = useMemo(() => ({
    ...authState,
    signOut,
    refreshAuth,
  }), [authState, signOut, refreshAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protecting components/hooks that require authentication
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);
  
  return { isAuthenticated, isLoading };
}
