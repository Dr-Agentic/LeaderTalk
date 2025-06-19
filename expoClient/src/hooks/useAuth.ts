import { useState, useEffect } from 'react';
import { getSupabase } from '@/src/supabase';
import { useRouter } from 'expo-router';

interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // For demo purposes, we'll simulate a logged-in user
        // In a real app, you would check the session with Supabase
        const demoUser = {
          id: 999,
          email: 'demo@example.com',
          username: 'Demo User',
          firstName: 'Demo',
          lastName: 'User',
          photoUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
        };
        
        setUser(demoUser);
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
