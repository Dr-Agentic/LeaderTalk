import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { getRecordings, deleteRecording } from '@/src/services/recordingService';
import { router } from 'expo-router';
import { theme } from '../../src/styles/theme';

interface Recording {
  id: string;
  title: string;
  recordedAt: string;
  duration: number;
  analysisResult?: {
    overview: { rating: string; score: number };
  };
}

export default function RecordingsScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setIsLoading(true);
      const data = await getRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      Alert.alert('Error', 'Failed to load recordings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecordings();
    setRefreshing(false);
  };

  const handleDeleteRecording = async (id: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(id);
              setRecordings(prev => prev.filter(r => r.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recording');
            }
          }
        }
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Your Recordings</ThemedText>
          <ThemedText style={styles.subtitle}>
            View and analyze your past conversations
          </ThemedText>
        </View>
        
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">Recent Recordings</ThemedText>
            <TouchableOpacity style={styles.filterButton}>
              <FontAwesome name="filter" size={16} color={textColor} />
              <ThemedText style={styles.filterText}>Filter</ThemedText>
            </TouchableOpacity>
          </View>
          
          {recordings.length > 0 ? (
            recordings.map((recording) => (
              <TouchableOpacity
                key={recording.id}
                style={styles.recordingItem}
                onPress={() => router.push(`/recording/${recording.id}`)}
              >
                <View style={styles.recordingHeader}>
                  <ThemedText style={styles.recordingTitle}>{recording.title}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleDeleteRecording(recording.id)}
                    style={styles.deleteButton}
                  >
                    <FontAwesome name="trash" size={16} color="#f44336" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.recordingMeta}>
                  <ThemedText style={styles.metaText}>
                    <FontAwesome name="clock-o" size={12} color={textColor} /> {formatDuration(recording.duration)}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    <FontAwesome name="calendar" size={12} color={textColor} /> {formatDate(recording.recordedAt)}
                  </ThemedText>
                </View>
                
                {recording.analysisResult?.overview && (
                  <View style={styles.scoreContainer}>
                    <ThemedText style={styles.scoreLabel}>Score:</ThemedText>
                    <ThemedText style={[
                      styles.scoreValue,
                      { color: recording.analysisResult.overview.score >= 80 ? '#4CAF50' : 
                               recording.analysisResult.overview.score >= 60 ? '#FF9800' : '#f44336' }
                    ]}>
                      {recording.analysisResult.overview.score}/100
                    </ThemedText>
                    <ThemedText style={styles.ratingText}>({recording.analysisResult.overview.rating})</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <ThemedView style={styles.emptyState}>
              <FontAwesome 
                name="microphone" 
                size={48} 
                color={colorScheme === 'dark' ? '#555' : '#ccc'} 
              />
              <ThemedText style={styles.emptyText}>
                No recordings yet
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Start recording your conversations to get feedback and improve your communication skills
              </ThemedText>
              <TouchableOpacity 
                style={styles.recordButton}
                onPress={() => router.push('/record')}
              >
                <FontAwesome name="microphone" size={16} color="#fff" />
                <ThemedText style={styles.recordButtonText}>
                  Start Recording
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginVertical: 16,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    marginLeft: 6,
  },
  recordingItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0070f3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  recordButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  recordingMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
