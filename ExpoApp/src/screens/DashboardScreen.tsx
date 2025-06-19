import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

// Types
interface Transcript {
  id: number;
  title: string;
  date: string;
  duration: number;
  score: number;
}

interface Insight {
  id: number;
  title: string;
  description: string;
  type: 'strength' | 'improvement';
}

const DashboardScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [recentTranscripts, setRecentTranscripts] = useState<Transcript[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data
        const userData = await apiRequest<{ username: string }>('GET', '/api/users/me');
        setUserName(userData.username || 'User');
        
        // Fetch recent transcripts
        const transcriptsData = await apiRequest<Transcript[]>('GET', '/api/transcripts/recent');
        setRecentTranscripts(transcriptsData || []);
        
        // Fetch insights
        const insightsData = await apiRequest<Insight[]>('GET', '/api/insights/recent');
        setInsights(insightsData || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleStartRecording = () => {
    navigation.navigate('Recording');
  };
  
  const handleViewTranscript = (id: number) => {
    navigation.navigate('TranscriptView', { id });
  };
  
  const handleViewAllTranscripts = () => {
    navigation.navigate('Transcripts');
  };
  
  const handleViewTraining = () => {
    navigation.navigate('Training');
  };
  
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {userName}</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7e22ce" />
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleStartRecording}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="mic" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionText}>Record</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleViewTraining}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="school" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionText}>Train</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleViewAllTranscripts}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="list" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Recent Transcripts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Recordings</Text>
                <TouchableOpacity onPress={handleViewAllTranscripts}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              {recentTranscripts.length > 0 ? (
                <View style={styles.transcriptsContainer}>
                  {recentTranscripts.map(transcript => (
                    <TouchableOpacity 
                      key={transcript.id}
                      style={styles.transcriptCard}
                      onPress={() => handleViewTranscript(transcript.id)}
                    >
                      <View style={styles.transcriptHeader}>
                        <Text style={styles.transcriptTitle}>{transcript.title}</Text>
                        <Text style={styles.transcriptScore}>{transcript.score}/100</Text>
                      </View>
                      <View style={styles.transcriptFooter}>
                        <Text style={styles.transcriptDate}>{transcript.date}</Text>
                        <Text style={styles.transcriptDuration}>{formatDuration(transcript.duration)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recordings yet</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={handleStartRecording}
                  >
                    <Text style={styles.emptyStateButtonText}>Start Recording</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Insights</Text>
              
              {insights.length > 0 ? (
                <View style={styles.insightsContainer}>
                  {insights.map(insight => (
                    <View 
                      key={insight.id}
                      style={[
                        styles.insightCard,
                        insight.type === 'strength' ? styles.strengthCard : styles.improvementCard
                      ]}
                    >
                      <View style={styles.insightIconContainer}>
                        <Ionicons 
                          name={insight.type === 'strength' ? 'star' : 'trending-up'} 
                          size={20} 
                          color={insight.type === 'strength' ? '#fbbf24' : '#7e22ce'} 
                        />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightDescription}>{insight.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Complete recordings to get insights</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#7e22ce',
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7e22ce',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
  },
  transcriptsContainer: {
    gap: 12,
  },
  transcriptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  transcriptScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7e22ce',
  },
  transcriptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transcriptDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  transcriptDuration: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  strengthCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  improvementCard: {
    backgroundColor: 'rgba(126, 34, 206, 0.1)',
    borderColor: 'rgba(126, 34, 206, 0.3)',
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#7e22ce',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
