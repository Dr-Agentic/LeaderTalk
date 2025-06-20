import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { getSupabase, exchangeCodeForSession } from '../../src/lib/supabaseAuth';
import { sendAuthCallback } from '../../src/lib/api';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback received with params:', params);
        
        // Extract the code from URL parameters
        const code = params.code as string;
        
        if (!code) {
          console.error('No code parameter found in URL');
          setError('Authentication failed: No code parameter found');
          setTimeout(() => router.replace('/login'), 2000);
          return;
        }
        
        setStatus('Exchanging code for session...');
        
        try {
          // Use the exchangeCodeForSession function that handles the PKCE flow
          const { session } = await exchangeCodeForSession(code);
          
          if (!session) {
            throw new Error('No session returned from code exchange');
          }
          
          console.log('Successfully authenticated with Supabase');
          setStatus('Authentication successful!');
          
          // Get user data from Supabase session
          const { user } = session;
          
          if (!user) {
            throw new Error('No user data in session');
          }
          
          // Send auth data to our server to create/update user and establish session
          setStatus('Syncing with server...');
          try {
            await sendAuthCallback({
              uid: user.id,
              email: user.email || '',
              displayName: user.user_metadata?.full_name,
              photoURL: user.user_metadata?.avatar_url,
              emailVerified: user.email_confirmed_at ? true : false,
            });
            
            console.log('Server sync complete');
            setStatus('Redirecting to dashboard...');
            
            // Navigate to the dashboard
            setTimeout(() => router.replace('/dashboard'), 500);
          } catch (serverError) {
            console.error('Error syncing with server:', serverError);
            // Even if server sync fails, we can still proceed with Supabase auth
            setStatus('Redirecting to dashboard...');
            setTimeout(() => router.replace('/dashboard'), 500);
          }
        } catch (sessionError) {
          console.error('Error exchanging code for session:', sessionError);
          setError(`Authentication failed: ${sessionError.message}`);
          setTimeout(() => router.replace('/login'), 2000);
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError(`Authentication error: ${(error as Error).message}`);
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [params, router]);

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.redirectText}>Redirecting to login...</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#8A2BE2" />
            <Text style={styles.statusText}>{status}</Text>
          </>
        )}
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
    padding: 20,
  },
  statusText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  redirectText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});
