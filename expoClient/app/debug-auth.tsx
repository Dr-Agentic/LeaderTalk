import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { AppLayout } from '../src/components/navigation/AppLayout';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { ThemedText } from '../src/components/ThemedText';
import { clearAuthAndRedirect, isAuthenticated, getCurrentSession } from '../src/lib/authUtils';

export default function DebugAuthScreen() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [sessionInfo, setSessionInfo] = useState<string>('Loading...');

  const checkAuthStatus = async () => {
    const authenticated = await isAuthenticated();
    setAuthStatus(authenticated ? 'Authenticated ✅' : 'Not Authenticated ❌');
    
    const session = await getCurrentSession();
    if (session) {
      setSessionInfo(`User: ${session.user?.email || 'Unknown'}\nExpires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
    } else {
      setSessionInfo('No session found');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleClearAuth = async () => {
    const success = await clearAuthAndRedirect();
    if (success) {
      router.replace('/login');
    }
  };

  const handleRefreshStatus = () => {
    checkAuthStatus();
  };

  return (
    <AppLayout
      showBackButton
      backTo="/dashboard"
      backLabel="Back"
      pageTitle="Auth Debug"
    >
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <ThemedText style={styles.title}>Authentication Status</ThemedText>
            
            <View style={styles.section}>
              <ThemedText style={styles.label}>Status:</ThemedText>
              <ThemedText style={styles.value}>{authStatus}</ThemedText>
            </View>
            
            <View style={styles.section}>
              <ThemedText style={styles.label}>Session Info:</ThemedText>
              <ThemedText style={styles.value}>{sessionInfo}</ThemedText>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Refresh Status"
                onPress={handleRefreshStatus}
                variant="secondary"
                style={styles.button}
              />
              
              <Button
                title="Clear Auth & Go to Login"
                onPress={handleClearAuth}
                variant="cta"
                style={styles.button}
              />
              
              <Button
                title="Go to Dashboard"
                onPress={() => router.push('/dashboard')}
                variant="secondary"
                style={styles.button}
              />
              
              <Button
                title="Go to Login"
                onPress={() => router.push('/login')}
                variant="secondary"
                style={styles.button}
              />
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  button: {
    width: '100%',
  },
});
