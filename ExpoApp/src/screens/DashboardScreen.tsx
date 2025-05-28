import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Recording, WordUsageData } from '../types';

export default function DashboardScreen() {
  const navigation = useNavigation();
  
  // Fetch recent recordings
  const { 
    data: recordings, 
    isLoading: isLoadingRecordings,
    error: recordingsError
  } = useQuery({
    queryKey: ['/api/recordings'],
    queryFn: () => apiRequest<Recording[]>('GET', '/api/recordings?limit=3'),
  });

  // Fetch word usage data
  const { 
    data: wordUsageData, 
    isLoading: isLoadingWordUsage,
    error: wordUsageError
  } = useQuery<WordUsageData>({
    queryKey: ['/api/users/word-usage'],
    queryFn: () => apiRequest<WordUsageData>('GET', '/api/users/word-usage'),
  });

  // Navigate to recording screen
  const handleStartRecording = () => {
    navigation.navigate('Recording');
  };

  // Navigate to transcript view
  const handleViewTranscript = (id: number) => {
    navigation.navigate('TranscriptView', { id });
  };

  // Navigate to all transcripts
  const handleViewAllTranscripts = () => {
    navigation.navigate('Transcripts');
  };

  // Navigate to training
  const handleViewTraining = () => {
    navigation.navigate('Training');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate word usage percentage
  const calculateWordUsagePercentage = () => {
    if (!wordUsageData || !wordUsageData.wordLimit) return 0;
    return (wordUsageData.currentUsage / wordUsageData.wordLimit) * 100;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleStartRecording}
        >
          <View style={[styles.actionIcon, styles.recordIcon]}>
            <MaterialIcons name="mic" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Record</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleViewAllTranscripts}
        >
          <View style={[styles.actionIcon, styles.transcriptIcon]}>
            <MaterialIcons name="list" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Transcripts</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleViewTraining}
        >
          <View style={[styles.actionIcon, styles.trainingIcon]}>
            <MaterialIcons name="school" size={24} color="white" />
          </View>
          <Text style={styles.actionText}>Training</Text>
        </TouchableOpacity>
      </View>

      {/* Word Usage */}
      <Card style={styles.card}>
        <Card.Title title="Word Usage" />
        <Card.Content>
          {isLoadingWordUsage ? (
            <Text style={styles.loadingText}>Loading word usage data...</Text>
          ) : wordUsageError ? (
            <Text style={styles.errorText}>Error loading word usage data</Text>
          ) : wordUsageData ? (
            <View>
              <View style={styles.usageRow}>
                <Text style={styles.usageText}>
                  {wordUsageData.currentUsage} / {wordUsageData.wordLimit} words used
                </Text>
                <Text style={styles.resetText}>
                  Resets in {wordUsageData.daysRemaining} days
                </Text>
              </View>
              <ProgressBar
                progress={calculateWordUsagePercentage() / 100}
                color={calculateWordUsagePercentage() > 90 ? '#ef4444' : '#3b82f6'}
                style={styles.progressBar}
              />
            </View>
          ) : (
            <Text style={styles.errorText}>No word usage data available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Recent Recordings */}
      <Card style={styles.card}>
        <Card.Title 
          title="Recent Recordings" 
          right={(props) => (
            <Button 
              onPress={handleViewAllTranscripts}
              mode="text"
            >
              View All
            </Button>
          )}
        />
        <Card.Content>
          {isLoadingRecordings ? (
            <Text style={styles.loadingText}>Loading recordings...</Text>
          ) : recordingsError ? (
            <Text style={styles.errorText}>Error loading recordings</Text>
          ) : recordings && recordings.length > 0 ? (
            recordings.map((recording) => (
              <TouchableOpacity
                key={recording.id}
                style={styles.recordingItem}
                onPress={() => handleViewTranscript(recording.id)}
              >
                <View style={styles.recordingInfo}>
                  <Text style={styles.recordingTitle}>{recording.title}</Text>
                  <Text style={styles.recordingDate}>
                    {formatDate(recording.createdAt)}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="mic-none" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No recordings yet</Text>
              <Button 
                mode="contained" 
                onPress={handleStartRecording}
                style={styles.startButton}
              >
                Start Recording
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Training Progress */}
      <Card style={styles.card}>
        <Card.Title title="Training Progress" />
        <Card.Content>
          <View style={styles.trainingProgress}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>0%</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Complete your first module</Text>
              <Text style={styles.progressDescription}>
                Start your communication training journey
              </Text>
              <Button 
                mode="outlined" 
                onPress={handleViewTraining}
                style={styles.trainingButton}
              >
                Go to Training
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIcon: {
    backgroundColor: '#e53e3e',
  },
  transcriptIcon: {
    backgroundColor: '#3b82f6',
  },
  trainingIcon: {
    backgroundColor: '#10b981',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
    padding: 16,
    color: '#6b7280',
  },
  errorText: {
    textAlign: 'center',
    padding: 16,
    color: '#ef4444',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resetText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginVertical: 8,
  },
  startButton: {
    marginTop: 16,
    backgroundColor: '#e53e3e',
  },
  trainingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  trainingButton: {
    alignSelf: 'flex-start',
  },
});
