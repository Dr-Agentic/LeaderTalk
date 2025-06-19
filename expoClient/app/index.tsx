import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getSupabase } from '../src/lib/supabaseAuth';

export default function IndexScreen() {
  useEffect(() => {
    // Check authentication status and redirect accordingly
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard');
        } else {
          // User is not authenticated, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // On error, redirect to login as a fallback
        router.replace('/login');
      }
    };
    
    checkAuthAndRedirect();
  }, []);

  // This screen is just a router/redirector, so we return an empty view
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
});
