import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { AppLayout } from '../../src/components/navigation/AppLayout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ThemedText } from '../../src/components/ThemedText';
import CommunicationChart from '../../src/components/charts/CommunicationChart';
import { apiRequest } from '../../src/lib/apiService';

// Types
interface AnalysisInstance {
  text: string;
  analysis: string;
  improvement?: string;
  timestamp: number;
}

interface AnalysisResult {
  overview?: {
    rating?: string;
  };
  timeline?: any[];
  positiveInstances?: AnalysisInstance[];
  negativeInstances?: AnalysisInstance[];
  passiveInstances?: AnalysisInstance[];
}

interface Recording {
  id: number;
  title: string;
  recordedAt: string;
  transcription?: string;
  analysisResult?: AnalysisResult;
}

interface RecordingWithAnalysis extends Omit<Recording, 'analysisResult'> {
  analysis: AnalysisResult | null;
}

interface Leader {
  id: number;
  name: string;
}

export default function TranscriptView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordingId = parseInt(params.id as string);
  const queryClient = useQueryClient();

  const [progress, setProgress] = useState<number>(0);
  const [activeInstance, setActiveInstance] = useState<number | null>(null);
  const [activeLeader, setActiveLeader] = useState<number | null>(null);
  const [leaderAlternatives, setLeaderAlternatives] = useState<{
    [key: string]: string;
  }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Animation effect for progress bar during analysis
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 85) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  // Query for recording details
  const { data: recording, isLoading: recordingLoading } = useQuery<RecordingWithAnalysis>({
    queryKey: ['/api/recordings', recordingId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/recordings/${recordingId}`);
      const data = await response.json();
      
      return {
        ...data,
        analysis: data.analysisResult,
      };
    },
    enabled: !isNaN(recordingId),
  });

  // Query for user's selected leaders only (optimized)
  const { data: selectedLeaders, isLoading: leadersLoading } = useQuery<Leader[]>({
    queryKey: ['/api/users/me/selected-leaders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users/me/selected-leaders');
      return await response.json();
    },
  });

  // Set up polling for analysis results
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    if (recording && (!recording.analysis || Object.keys(recording.analysis).length === 0)) {
      const pollForAnalysis = () => {
        console.log('Polling for analysis results...');
        queryClient.invalidateQueries({
          queryKey: ['/api/recordings', recordingId],
        });
      };

      pollingRef.current = setInterval(pollForAnalysis, 1000);
      console.log('Started polling for analysis results');
    } else if (recording && recording.analysis) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        console.log('Analysis complete, stopped polling');
      }
      setProgress(100);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [recording, recordingId, queryClient]);

  const isLoading = recordingLoading || leadersLoading;

  // Fetch leader alternative
  const fetchLeaderAlternative = async (instance: AnalysisInstance, leaderId: number) => {
    const cacheKey = `${leaderId}:${instance.text}`;

    if (leaderAlternatives[cacheKey] || loading[cacheKey]) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [cacheKey]: true }));

      const response = await apiRequest('GET', `/api/leaders/${leaderId}/alternatives?text=${encodeURIComponent(instance.text)}`);
      const data = await response.json();

      setLeaderAlternatives((prev) => ({
        ...prev,
        [cacheKey]: data.alternativeText,
      }));
    } catch (error) {
      console.error('Error fetching leader alternative:', error);
      Alert.alert('Error', 'Could not load alternative text');
    } finally {
      setLoading((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  const getLeaderAlternative = (instance: AnalysisInstance, leaderId: number) => {
    const cacheKey = `${leaderId}:${instance.text}`;

    if (leaderAlternatives[cacheKey]) {
      return leaderAlternatives[cacheKey];
    }

    fetchLeaderAlternative(instance, leaderId);
    return loading[cacheKey]
      ? 'Loading alternative response...'
      : 'Click to load alternative response';
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <AppLayout showBackButton backTo="/transcripts" backLabel="Back to All Transcripts">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
        </View>
      </AppLayout>
    );
  }

  if (!recording) {
    return (
      <AppLayout showBackButton backTo="/transcripts" backLabel="Back to All Transcripts">
        <View style={styles.centerContainer}>
          <ThemedText style={styles.title}>Recording Not Found</ThemedText>
          <ThemedText style={styles.description}>
            The requested recording could not be found.
          </ThemedText>
        </View>
      </AppLayout>
    );
  }

  // Analysis in progress
  if (!recording.analysis || Object.keys(recording.analysis).length === 0) {
    return (
      <AppLayout showBackButton backTo="/dashboard" backLabel="Back to Dashboard">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <GlassCard style={styles.analysisCard}>
            <View style={styles.analysisContent}>
              <ThemedText style={styles.title}>Analysis in Progress</ThemedText>
              
              <ActivityIndicator size="large" color="#8A2BE2" style={styles.spinner} />
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <ThemedText style={styles.progressText}>
                  Your recording is being analyzed by our AI. This usually takes less than a minute.
                </ThemedText>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Return to Dashboard"
                  onPress={() => router.push('/dashboard')}
                  variant="secondary"
                  icon={<Feather name="arrow-left" size={16} color="#fff" />}
                />
                
                <Button
                  title="Start New Recording"
                  onPress={() => router.push('/recording')}
                  variant="secondary"
                  icon={<Feather name="mic" size={16} color="#fff" />}
                />
                
                <Button
                  title="Refresh Results"
                  onPress={() => {
                    queryClient.invalidateQueries({
                      queryKey: ['/api/recordings', recordingId],
                    });
                  }}
                  variant="cta"
                  icon={<Feather name="refresh-cw" size={16} color="#fff" />}
                />
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      showBackButton 
      backTo="/transcripts" 
      backLabel="Back to All Transcripts"
      pageTitle={`${recording.title} - Transcript`}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card with Communication Chart */}
        <GlassCard style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View>
              <ThemedText style={styles.title}>{recording.title}</ThemedText>
              <ThemedText style={styles.subtitle}>
                Recorded {new Date(recording.recordedAt).toLocaleDateString()}
                {recording.analysis?.overview?.rating && ` • Overall: ${recording.analysis.overview.rating}`}
              </ThemedText>
            </View>
            {recording.analysis?.overview?.rating && (
              <View style={[
                styles.badge,
                recording.analysis.overview.rating === 'Good' ? styles.badgePositive :
                recording.analysis.overview.rating === 'Average' ? styles.badgeWarning :
                styles.badgeNegative
              ]}>
                <ThemedText style={styles.badgeText}>
                  {recording.analysis.overview.rating} overall
                </ThemedText>
              </View>
            )}
          </View>
          
          {/* Communication Analysis Chart */}
          <CommunicationChart 
            data={recording.analysis?.timeline || []} 
            loading={false} 
          />
        </GlassCard>

        {/* Transcript Card */}
        <GlassCard style={styles.card}>
          <ThemedText style={styles.cardTitle}>Transcript Analysis</ThemedText>
          
          <View style={styles.badgeContainer}>
            <View style={[styles.legendBadge, styles.badgePositive]}>
              <ThemedText style={styles.badgeText}>Positive Communication</ThemedText>
            </View>
            <View style={[styles.legendBadge, styles.badgeNegative]}>
              <ThemedText style={styles.badgeText}>Negative Communication</ThemedText>
            </View>
            <View style={[styles.legendBadge, styles.badgeWarning]}>
              <ThemedText style={styles.badgeText}>Needs Improvement</ThemedText>
            </View>
          </View>

          {recording.transcription ? (
            <TranscriptWithHighlighting
              transcription={recording.transcription}
              analysis={recording.analysis}
            />
          ) : (
            <ThemedText style={styles.emptyText}>
              No transcript available for this recording.
            </ThemedText>
          )}
        </GlassCard>

        {/* Analysis Cards */}
        <View style={styles.analysisGrid}>
          <GlassCard style={styles.card}>
            <ThemedText style={[styles.cardTitle, { color: '#7EFEF7' }]}>
              Positive Moments
            </ThemedText>
            <AnalysisInstancesList
              instances={recording.analysis?.positiveInstances || []}
              emptyMessage="No positive communication moments identified."
              type="positive"
            />
          </GlassCard>

          <GlassCard style={styles.card}>
            <ThemedText style={[styles.cardTitle, { color: '#FFB0B0' }]}>
              Negative Moments
            </ThemedText>
            <AnalysisInstancesList
              instances={recording.analysis?.negativeInstances || []}
              emptyMessage="No negative communication moments identified."
              type="negative"
              selectedLeaders={selectedLeaders || []}
              activeInstance={activeInstance}
              setActiveInstance={setActiveInstance}
              activeLeader={activeLeader}
              setActiveLeader={setActiveLeader}
              getLeaderAlternative={getLeaderAlternative}
            />
          </GlassCard>
        </View>

        <GlassCard style={styles.card}>
          <ThemedText style={[styles.cardTitle, { color: '#C8A2EA' }]}>
            Areas for Improvement
          </ThemedText>
          <AnalysisInstancesList
            instances={recording.analysis?.passiveInstances || []}
            emptyMessage="No passive communication moments identified."
            type="passive"
          />
        </GlassCard>
      </ScrollView>
    </AppLayout>
  );
}

// Transcript highlighting component
function TranscriptWithHighlighting({ transcription, analysis }: {
  transcription: string;
  analysis: AnalysisResult | null;
}) {
  if (!analysis) {
    return <ThemedText style={styles.transcriptText}>{transcription}</ThemedText>;
  }

  const positiveInstances = analysis.positiveInstances || [];
  const negativeInstances = analysis.negativeInstances || [];
  const passiveInstances = analysis.passiveInstances || [];

  if (!transcription || (!positiveInstances.length && !negativeInstances.length && !passiveInstances.length)) {
    return <ThemedText style={styles.transcriptText}>{transcription}</ThemedText>;
  }

  // For mobile, we'll show a simplified version without complex highlighting
  // due to React Native's limited HTML rendering capabilities
  return (
    <View style={styles.transcriptContainer}>
      <ThemedText style={styles.transcriptText}>{transcription}</ThemedText>
      <ThemedText style={styles.highlightNote}>
        💡 Highlighted moments are shown in the analysis sections below
      </ThemedText>
    </View>
  );
}

// Analysis instances list component
function AnalysisInstancesList({
  instances,
  emptyMessage,
  type,
  selectedLeaders = [],
  activeInstance,
  setActiveInstance,
  activeLeader,
  setActiveLeader,
  getLeaderAlternative,
}: {
  instances: AnalysisInstance[];
  emptyMessage: string;
  type: 'positive' | 'negative' | 'passive';
  selectedLeaders?: Leader[];
  activeInstance?: number | null;
  setActiveInstance?: (index: number | null) => void;
  activeLeader?: number | null;
  setActiveLeader?: (id: number | null) => void;
  getLeaderAlternative?: (instance: AnalysisInstance, leaderId: number) => string;
}) {
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!instances.length) {
    return <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>;
  }

  return (
    <View style={styles.instancesList}>
      {instances.map((instance, index) => (
        <View key={index} style={styles.instanceItem}>
          <View style={styles.instanceHeader}>
            <View style={[
              styles.instanceQuote,
              type === 'positive' ? styles.quotePositive :
              type === 'negative' ? styles.quoteNegative :
              styles.quotePassive
            ]}>
              <ThemedText style={styles.quoteText}>"{instance.text}"</ThemedText>
            </View>
            <ThemedText style={styles.timestamp}>
              {formatTimestamp(instance.timestamp)}
            </ThemedText>
          </View>
          
          <ThemedText style={styles.analysisText}>{instance.analysis}</ThemedText>
          
          {instance.improvement && (
            <ThemedText style={styles.improvementText}>
              <ThemedText style={styles.improvementLabel}>Suggestion: </ThemedText>
              {instance.improvement}
            </ThemedText>
          )}

          {/* Leader suggestions for negative moments */}
          {type === 'negative' && selectedLeaders && selectedLeaders.length > 0 && (
            <View style={styles.leaderSection}>
              <ThemedText style={styles.leaderPrompt}>
                How would your selected leaders express this?
              </ThemedText>
              
              <View style={styles.leaderButtons}>
                {selectedLeaders.map((leader) => (
                  <TouchableOpacity
                    key={leader.id}
                    style={[
                      styles.leaderButton,
                      activeLeader === leader.id && activeInstance === index && styles.leaderButtonActive
                    ]}
                    onPress={() => {
                      if (setActiveLeader && setActiveInstance) {
                        if (activeLeader === leader.id && activeInstance === index) {
                          setActiveLeader(null);
                          setActiveInstance(null);
                        } else {
                          setActiveLeader(leader.id);
                          setActiveInstance(index);
                        }
                      }
                    }}
                  >
                    <Feather name="message-square" size={14} color="#fff" />
                    <ThemedText style={styles.leaderButtonText}>{leader.name}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {activeLeader && activeInstance === index && getLeaderAlternative && (
                <View style={styles.leaderResponse}>
                  <ThemedText style={styles.leaderResponseHeader}>
                    {selectedLeaders.find((l) => l.id === activeLeader)?.name}'s Approach:
                  </ThemedText>
                  <ThemedText style={styles.leaderResponseText}>
                    {getLeaderAlternative(instance, activeLeader)}
                  </ThemedText>
                </View>
              )}
            </View>
          )}

          {index < instances.length - 1 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  analysisCard: {
    padding: 24,
    alignItems: 'center',
  },
  analysisContent: {
    alignItems: 'center',
    width: '100%',
  },
  spinner: {
    marginVertical: 24,
  },
  progressContainer: {
    width: '100%',
    marginVertical: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
  },
  headerCard: {
    padding: 16,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  legendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  transcriptContainer: {
    marginTop: 8,
  },
  transcriptText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  highlightNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    marginTop: 12,
  },
  analysisGrid: {
    gap: 16,
  },
  instancesList: {
    gap: 16,
  },
  instanceItem: {
    gap: 8,
  },
  instanceHeader: {
    gap: 8,
  },
  instanceQuote: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  quotePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  quoteNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  quotePassive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  quoteText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  analysisText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  improvementText: {
    fontSize: 14,
    color: '#60A5FA',
    marginLeft: 8,
  },
  improvementLabel: {
    fontWeight: '600',
  },
  leaderSection: {
    marginTop: 12,
    marginLeft: 8,
  },
  leaderPrompt: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  leaderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  leaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderButtonActive: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  leaderButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  leaderResponse: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
  },
  leaderResponseHeader: {
    fontSize: 12,
    color: '#93C5FD',
    marginBottom: 8,
  },
  leaderResponseText: {
    fontSize: 14,
    color: '#DBEAFE',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 12,
  },
});
