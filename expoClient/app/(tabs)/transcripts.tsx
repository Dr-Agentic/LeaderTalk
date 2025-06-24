import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppLayout } from '../../src/components/navigation/AppLayout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ThemedText } from '../../src/components/ThemedText';

// Mock data for demonstration
const MOCK_TRANSCRIPTS = [
  {
    id: '1',
    title: 'Team Meeting Discussion',
    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 325,
    status: 'completed',
    analysisResult: {
      overview: {
        rating: 'Good',
        score: 82
      }
    }
  },
  {
    id: '2',
    title: 'Client Presentation',
    recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 1200,
    status: 'completed',
    analysisResult: {
      overview: {
        rating: 'Excellent',
        score: 91
      }
    }
  },
  {
    id: '3',
    title: 'Weekly Standup',
    recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 180,
    status: 'processing',
  }
];

export default function TranscriptsScreen() {
  const [transcripts, setTranscripts] = useState(MOCK_TRANSCRIPTS);
  const [isLoading, setIsLoading] = useState(false);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'processing':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return 'rgba(255, 255, 255, 0.5)';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const handleTranscriptPress = (transcript: any) => {
    // Navigate to transcript detail page
    router.push(`/transcript/${transcript.id}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading transcripts...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>All Transcripts</ThemedText>
          <ThemedText style={styles.subtitle}>
            {transcripts.length} recording{transcripts.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {transcripts.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Feather name="file-text" size={48} color="rgba(255, 255, 255, 0.5)" />
              <ThemedText style={styles.emptyTitle}>No transcripts yet</ThemedText>
              <ThemedText style={styles.emptyDescription}>
                Start recording conversations to see your transcripts here.
              </ThemedText>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={() => router.push('/recording')}
              >
                <Feather name="mic" size={20} color="#fff" />
                <ThemedText style={styles.recordButtonText}>Start Recording</ThemedText>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.transcriptsList}>
            {transcripts.map((transcript) => (
              <TouchableOpacity
                key={transcript.id}
                onPress={() => handleTranscriptPress(transcript)}
              >
                <GlassCard style={styles.transcriptCard}>
                  <View style={styles.transcriptContent}>
                    <View style={styles.transcriptHeader}>
                      <ThemedText style={styles.transcriptTitle}>
                        {transcript.title}
                      </ThemedText>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(transcript.status) },
                        ]}
                      >
                        <ThemedText style={styles.statusText}>
                          {transcript.status}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.transcriptMeta}>
                      <View style={styles.metaItem}>
                        <Feather name="calendar" size={14} color="rgba(255, 255, 255, 0.7)" />
                        <ThemedText style={styles.metaText}>
                          {formatDate(transcript.recordedAt)}
                        </ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Feather name="clock" size={14} color="rgba(255, 255, 255, 0.7)" />
                        <ThemedText style={styles.metaText}>
                          {formatDuration(transcript.duration)}
                        </ThemedText>
                      </View>
                    </View>

                    {transcript.analysisResult && (
                      <View style={styles.scoreContainer}>
                        <ThemedText style={styles.scoreLabel}>Score:</ThemedText>
                        <ThemedText
                          style={[
                            styles.scoreValue,
                            { color: getScoreColor(transcript.analysisResult.overview.score) },
                          ]}
                        >
                          {transcript.analysisResult.overview.score}/100
                        </ThemedText>
                        <ThemedText style={styles.ratingText}>
                          ({transcript.analysisResult.overview.rating})
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.transcriptFooter}>
                      <Feather name="chevron-right" size={20} color="rgba(255, 255, 255, 0.5)" />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  transcriptsList: {
    gap: 16,
  },
  transcriptCard: {
    marginBottom: 0,
  },
  transcriptContent: {
    padding: 20,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  transcriptMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  transcriptFooter: {
    alignItems: 'flex-end',
  },
});
