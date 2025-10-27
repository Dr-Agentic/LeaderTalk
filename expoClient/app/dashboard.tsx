import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getSupabase, signOut } from '../src/lib/supabaseAuth';
import { AppLayout } from '../src/components/navigation/AppLayout';
import QuickActions from '../src/components/dashboard/QuickActions';
import { QuoteDisplay } from '../src/components/dashboard/QuoteDisplay';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { ThemedText } from '../src/components/ThemedText';
import { useTheme } from '../src/hooks/useTheme';
import { API_URL } from '../src/lib/api';

// Helper function to calculate weekly improvement
function calculateWeeklyImprovement(recordings: any[]) {
  if (!recordings || recordings.length === 0) return 0;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeek = recordings.filter((r: any) => new Date(r.createdAt) >= oneWeekAgo);
  const lastWeek = recordings.filter((r: any) => {
    const date = new Date(r.createdAt);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });
  
  const thisWeekAvg = thisWeek.length > 0 
    ? thisWeek.reduce((sum: number, r: any) => sum + (r.analysisResult?.overallScore || 0), 0) / thisWeek.length 
    : 0;
  const lastWeekAvg = lastWeek.length > 0 
    ? lastWeek.reduce((sum: number, r: any) => sum + (r.analysisResult?.overallScore || 0), 0) / lastWeek.length 
    : 0;
  
  return lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const [showQuote, setShowQuote] = useState(true);
  
  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      
      return response.json();
    },
  });
  
  // Fetch recordings data
  const { data: recordingsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['/api/recordings'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/recordings`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.statusText}`);
      }
      
      return response.json();
    },
  });
  
  // Auto-hide quote after 10 seconds
  useEffect(() => {
    if (showQuote) {
      const timer = setTimeout(() => {
        setShowQuote(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showQuote]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (userLoading || recordingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
      </View>
    );
  }

  const lastRecording = recordingsData && recordingsData.length > 0 ? recordingsData[0] : null;

  return (
    <AppLayout>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quote Display */}
        {showQuote && (
          <QuoteDisplay />
        )}

        {/* Quick Actions */}
        <QuickActions 
          recordingsCount={recordingsData?.length || 0}
          weeklyImprovement={Math.round(calculateWeeklyImprovement(recordingsData || []))}
        />

        {/* Record Conversation Card */}
        <GlassCard style={styles.recordCard}>
          <View style={styles.recordCardContent}>
            <ThemedText style={styles.recordCardTitle}>Record a Conversation</ThemedText>
            <ThemedText style={styles.recordCardDescription}>
              Record your conversations to get AI-powered insights on your communication style.
            </ThemedText>
            
            <Button
              title="Start Recording"
              onPress={() => router.push('/recording')}
              variant="cta"
              size="large"
              style={styles.recordButton}
              icon={<Feather name="mic" size={20} color="#fff" style={styles.recordButtonIcon} />}
            />
          </View>
        </GlassCard>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  recordCard: {
    marginTop: 32,
  },
  recordCardContent: {
    padding: 24,
  },
  recordCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  recordCardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  recordButton: {
    marginTop: 8,
  },
  recordButtonIcon: {
    marginRight: 8,
  },
});
