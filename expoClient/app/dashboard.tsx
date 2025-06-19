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
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getSupabase, signOut } from '../src/lib/supabaseAuth';
import QuickActions from '../src/components/dashboard/QuickActions';
import { QuoteDisplay } from '../src/components/dashboard/QuoteDisplay';
import AnalysisDisplay from '../src/components/dashboard/AnalysisDisplay';

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
  const [userName, setUserName] = useState('');
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
          setUserName('Demo User');
          // Load mock data for demo user
          setRecordings(MOCK_RECORDINGS);
          setLeaders(MOCK_LEADERS);
        } else {
          setUserName(user?.user_metadata?.full_name || user?.email || 'User');
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
      <LinearGradient
        colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
        style={styles.loadingContainer}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  const lastRecording = recordings && recordings.length > 0 ? recordings[0] : null;

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a0033', '#0a0a0a']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <TouchableOpacity 
              style={styles.viewAllLink}
              onPress={() => router.push('/transcripts')}
            >
              <Text style={styles.viewAllText}>View all transcripts</Text>
              <Feather name="chevron-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Quote Display */}
          {showQuote && (
            <QuoteDisplay />
          )}

          {/* Quick Actions */}
          <QuickActions 
            recordingsCount={recordings.length}
            weeklyImprovement={Math.round(calculateWeeklyImprovement(recordings))}
          />

          {/* Analysis Display */}
          {lastRecording && lastRecording.analysisResult && (
            <AnalysisDisplay 
              recording={lastRecording}
              leaders={leaders}
            />
          )}

          {/* Record Conversation Card */}
          <View style={styles.recordCard}>
            <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
              <View style={styles.recordCardContent}>
                <Text style={styles.recordCardTitle}>Record a Conversation</Text>
                <Text style={styles.recordCardDescription}>
                  Record your conversations to get AI-powered insights on your communication style.
                </Text>
                
                <TouchableOpacity 
                  style={styles.recordButton}
                  onPress={() => router.push('/recording')}
                >
                  <LinearGradient
                    colors={['#8A2BE2', '#FF6B6B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.recordButtonGradient}
                  >
                    <Feather name="mic" size={20} color="#fff" style={styles.recordButtonIcon} />
                    <Text style={styles.recordButtonText}>Start Recording</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
          
          {/* Sign Out Button */}
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 4,
  },
  recordCard: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
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
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  recordButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonIcon: {
    marginRight: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    marginTop: 40,
    padding: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 16,
    alignSelf: 'center',
  },
  signOutButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 16,
  },
});
