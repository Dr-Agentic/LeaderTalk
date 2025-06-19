import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { getSupabase } from '../../src/lib/supabaseAuth';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthCallback() {
  const router = useRouter();
  const { code } = useLocalSearchParams();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        if (typeof code === 'string') {
          console.log('Processing auth callback with code');
          
          // Get the initialized Supabase client
          const supabase = getSupabase();
          
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            router.replace('/login');
            return;
          }
          
          console.log('Successfully authenticated');
          
          // Redirect to the main app
          router.replace('/');
        } else {
          console.error('No code parameter found in URL');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.replace('/login');
      }
    }

    handleAuthCallback();
  }, [code, router]);

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.text}>Completing sign in...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
});
