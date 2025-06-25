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
import { getSupabase, signOut } from '../src/lib/supabaseAuth';
import { AppLayout } from '../src/components/navigation/AppLayout';
import QuickActions from '../src/components/dashboard/QuickActions';
import { QuoteDisplay } from '../src/components/dashboard/QuoteDisplay';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { ThemedText } from '../src/components/ThemedText';

// Mock data for demonstration purposes
const MOCK_RECORDINGS = [
  {
    id: '1',
    title: 'Team Meeting Discussion',
    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration: 325, // 5:25 minutes
    analysisResult: {
      timeline: [
        { time: 0, confidence: 0.7, clarity: 0.8, engagement: 0.6 },
        { time: 60, confidence: 0.8, clarity: 0.7, engagement: 0.7 },
        { time: 120, confidence: 0.6, clarity: 0.9, engagement: 0.8 },
        { time: 180, confidence: 0.9, clarity: 0.8, engagement: 0.9 },
        { time: 240, confidence: 0.7, clarity: 0.7, engagement: 0.8 },
        { time: 300, confidence: 0.8, clarity: 0.8, engagement: 0.7 },
      ],
      positiveInstances: [
        { timestamp: 45, analysis: "Great use of clear, concise language to explain the project goals." },
        { timestamp: 128, analysis: "Effective acknowledgment of team member contributions." },
        { timestamp: 210, analysis: "Strong, confident delivery of key metrics and results." }
      ],
      negativeInstances: [
        { timestamp: 75, analysis: "Slight hesitation when addressing budget concerns." },
        { timestamp: 180, analysis: "Could improve clarity when explaining technical details." }
      ],
      passiveInstances: [],
      leadershipInsights: [
        { 
          leaderId: "1", 
          leaderName: "Steve Jobs",
          advice: "Would have emphasized the vision more strongly and connected it to the product's impact on users' lives."
        },
        {
          leaderId: "2",
          leaderName: "Brené Brown",
          advice: "Would have created more space for team vulnerability and honest discussion about challenges."
        }
      ],
      overview: {
        rating: "Good",
        score: 82
      }
    }
  }
];

const MOCK_LEADERS = [
  { id: "1", name: "Steve Jobs" },
  { id: "2", name: "Brené Brown" },
  { id: "3", name: "Simon Sinek" }
];

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
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#8A2BE2" />
        <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
      </View>
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
    backgroundColor: 'transparent',
  },
  loadingText: {
    color: '#fff',
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
