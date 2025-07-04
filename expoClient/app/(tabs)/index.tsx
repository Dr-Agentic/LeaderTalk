import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getSupabase, signOut } from '../../src/lib/supabaseAuth';
import { AppLayout } from '../../src/components/navigation/AppLayout';
import QuickActions from '../../src/components/dashboard/QuickActions';
import { QuoteDisplay } from '../../src/components/dashboard/QuoteDisplay';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ThemedText } from '../../src/components/ThemedText';


// Helper function to calculate weekly improvement
function calculateWeeklyImprovement(recordings: any[]) {
  if (!recordings || recordings.length === 0) return 0;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeek = recordings.filter((r: any) => new Date(r.recordedAt) >= oneWeekAgo);
  const lastWeek = recordings.filter((r: any) => {
    const date = new Date(r.recordedAt);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });
  
  const thisWeekAvg = thisWeek.length > 0 
    ? thisWeek.reduce((sum: number, r: any) => sum + (r.analysisResult?.overview.score || 0), 0) / thisWeek.length 
    : 0;
  const lastWeekAvg = lastWeek.length > 0 
    ? lastWeek.reduce((sum: number, r: any) => sum + (r.analysisResult?.overview.score || 0), 0) / lastWeek.length 
    : 0;
  
  return lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;
}

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuote, setShowQuote] = useState(true);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  
  useEffect(() => {
    // Check authentication status when the component mounts
    const checkAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        
        console.log('Dashboard - Current auth status:', data.session ? 'Authenticated' : 'Not authenticated');
        
        if (!data.session) {
          console.log('No session found, redirecting to login');
          router.replace('/login');
          return;
        }
        
        // Get user details
        const { user } = data.session;
        console.log('User data:', user);
        
        // Check if it's the demo user
        const isDemo = user.email === 'demo@example.com';
        
        if (isDemo) {
          setUser({
            email: 'demo@example.com',
            user_metadata: {
              full_name: 'Demo User'
            }
          });
          // Load mock data for demo user
          setRecordings(MOCK_RECORDINGS);
          setLeaders(MOCK_LEADERS);
        } else {
          setUser(user);
          // In a real app, we would fetch real data from the API
          // For now, use mock data for all users
          setRecordings(MOCK_RECORDINGS);
          setLeaders(MOCK_LEADERS);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth in dashboard:', error);
        router.replace('/login');
      }
    };
    
    checkAuth();
    
    // Auto-hide quote after 10 seconds
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

  if (isLoading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <StatusBar style="light" />
          <ActivityIndicator size="large" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  const lastRecording = recordings && recordings.length > 0 ? recordings[0] : null;

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
          recordingsCount={recordings.length}
          weeklyImprovement={Math.round(calculateWeeklyImprovement(recordings))}
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
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
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
    color: '#fff',
    marginBottom: 8,
  },
  recordCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  recordButton: {
    marginTop: 8,
  },
  recordButtonIcon: {
    marginRight: 8,
  },
});
