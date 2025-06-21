import { useState, useEffect } from 'react';
import { getSupabase, signOut as supabaseSignOut } from '../lib/supabaseAuth';
import { router } from 'expo-router';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        const supabaseUser = data.session.user;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          photoUrl: supabaseUser.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    signOut,
    refreshAuth: checkAuthStatus,
  };
}