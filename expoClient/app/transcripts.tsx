import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { AppLayout } from '../src/components/navigation/AppLayout';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { SearchInput } from '../src/components/ui/SearchInput';
import { Picker } from '../src/components/ui/Picker';
import { TabView } from '../src/components/ui/TabView';
import { Badge } from '../src/components/ui/Badge';
import { ThemedText } from '../src/components/ThemedText';
import { apiRequest } from '../src/lib/apiService';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc';

interface Recording {
  id: string;
  title: string;
  recordedAt: string;
  duration: number;
  transcription?: string;
  analysisResult?: {
    overview?: {
      rating?: string;
      score?: number;
    };
    positiveInstances?: any[];
    negativeInstances?: any[];
  };
}

const sortOptions = [
  { label: 'Newest first', value: 'date-desc' },
  { label: 'Oldest first', value: 'date-asc' },
  { label: 'Highest rated first', value: 'rating-desc' },
  { label: 'Lowest rated first', value: 'rating-asc' },
];

const tabs = [
  { key: 'all', title: 'All' },
  { key: 'positive', title: 'Positive' },
  { key: 'needs-improvement', title: 'Needs Improvement' },
];

export default function AllTranscriptsScreen() {
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all recordings
  const { data: recordings, isLoading, refetch } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/recordings');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recordings:', error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Sort and filter recordings
  const filteredAndSortedRecordings = recordings
    ? getFilteredAndSortedRecordings(recordings, sortBy, searchQuery)
    : [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getTabContent = () => {
    let filteredRecordings = filteredAndSortedRecordings;

    switch (activeTab) {
      case 'positive':
        filteredRecordings = filteredAndSortedRecordings.filter(
          (r) =>
            r.analysisResult?.overview?.rating === 'Good' ||
            (r.analysisResult?.overview?.score &&
              r.analysisResult?.overview?.score > 65)
        );
        break;
      case 'needs-improvement':
        filteredRecordings = filteredAndSortedRecordings.filter(
          (r) =>
            r.analysisResult?.overview?.rating === 'Poor' ||
            r.analysisResult?.overview?.rating === 'Needs improvement' ||
            (r.analysisResult?.overview?.score !== undefined &&
              r.analysisResult?.overview?.score < 50)
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    if (isLoading) {
      return <TranscriptsSkeleton />;
    }

    if (filteredRecordings.length === 0) {
      return <EmptyState filter={activeTab !== 'all' ? activeTab : undefined} query={searchQuery} />;
    }

    return (
      <View style={styles.transcriptsList}>
        {filteredRecordings.map((recording) => (
          <TranscriptCard key={recording.id} recording={recording} />
        ))}
      </View>
    );
  };

  return (
    <AppLayout
      showBackButton
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="All Transcripts"
    >
      <StatusBar style="light" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.subtitle}>
            {recordings?.length || 0} recording{recordings?.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Search and Sort */}
        <View style={styles.filtersContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title or content..."
            style={styles.searchInput}
          />
          
          <Picker
            options={sortOptions}
            selectedValue={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
            icon="arrow-up-down"
          />
        </View>

        {/* Tabs */}
        <TabView
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {getTabContent()}
        </TabView>
      </ScrollView>
    </AppLayout>
  );
}

// Helper function to sort and filter recordings
function getFilteredAndSortedRecordings(
  recordings: Recording[],
  sortBy: SortOption,
  searchQuery: string
): Recording[] {
  // First filter based on search query
  let filtered = recordings;

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = recordings.filter(
      (recording) =>
        recording.title.toLowerCase().includes(query) ||
        (recording.transcription &&
          recording.transcription.toLowerCase().includes(query))
    );
  }

  // Then sort based on sortBy parameter
  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
      case 'date-asc':
        return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
      case 'rating-desc':
        const scoreA = a.analysisResult?.overview?.score || 0;
        const scoreB = b.analysisResult?.overview?.score || 0;
        return scoreB - scoreA;
      case 'rating-asc':
        const scoreC = a.analysisResult?.overview?.score || 0;
        const scoreD = b.analysisResult?.overview?.score || 0;
        return scoreC - scoreD;
      default:
        return 0;
    }
  });
}

// Card component for each transcript
function TranscriptCard({ recording }: { recording: Recording }) {
  // Format recording date
  const formattedDate = formatDistanceToNow(new Date(recording.recordedAt), {
    addSuffix: true,
  });

  // Format duration
  const minutes = Math.floor(recording.duration / 60);
  const seconds = recording.duration % 60;
  const formattedDuration = `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;

  // Determine rating badge variant and text
  const rating = recording.analysisResult?.overview?.rating || 'N/A';
  const score = recording.analysisResult?.overview?.score || 0;

  // Calculate star rating (1-5 scale)
  const normalizedScore = score / 20; // Convert 0-100 to 0-5
  const starRating = Math.max(1, Math.min(5, Math.round(normalizedScore)));

  const getBadgeVariant = () => {
    if (rating === 'Good' || score > 65) return 'success';
    if (rating === 'Average' || (score >= 50 && score <= 65)) return 'warning';
    return 'error';
  };

  // Count positive and negative instances
  const positiveCount = recording.analysisResult?.positiveInstances?.length || 0;
  const negativeCount = recording.analysisResult?.negativeInstances?.length || 0;

  const handlePress = () => {
    router.push(`/transcript/${recording.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <GlassCard style={styles.transcriptCard}>
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <ThemedText style={styles.cardTitle}>{recording.title}</ThemedText>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={14} color="rgba(255, 255, 255, 0.7)" />
                  <ThemedText style={styles.metaText}>{formattedDate}</ThemedText>
                </View>
                <ThemedText style={styles.metaSeparator}>•</ThemedText>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={14} color="rgba(255, 255, 255, 0.7)" />
                  <ThemedText style={styles.metaText}>{formattedDuration}</ThemedText>
                </View>
              </View>
            </View>

            <Badge variant={getBadgeVariant()}>
              <View style={styles.badgeContent}>
                <ThemedText style={styles.badgeText}>{rating}</ThemedText>
                {score > 0 && (
                  <View style={styles.starsContainer}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <ThemedText
                        key={i}
                        style={[
                          styles.star,
                          { color: i < starRating ? '#FBBF24' : 'rgba(255, 255, 255, 0.3)' },
                        ]}
                      >
                        ★
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            </Badge>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Feather name="thumbs-up" size={16} color="#10B981" />
              <ThemedText style={styles.statText}>
                {positiveCount} positive moment{positiveCount !== 1 ? 's' : ''}
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <Feather name="thumbs-down" size={16} color="#EF4444" />
              <ThemedText style={styles.statText}>
                {negativeCount} negative moment{negativeCount !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>

          {/* Transcription Preview */}
          {recording.transcription && (
            <View style={styles.transcriptionPreview}>
              <ThemedText style={styles.transcriptionText}>
                {recording.transcription.substring(0, 150)}
                {recording.transcription.length > 150 ? '...' : ''}
              </ThemedText>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.viewTranscriptButton}>
              <ThemedText style={styles.viewTranscriptText}>View transcript</ThemedText>
              <Feather name="chevron-right" size={16} color="#8A2BE2" />
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// Skeleton loader
function TranscriptsSkeleton() {
  return (
    <View style={styles.transcriptsList}>
      {[1, 2, 3].map((i) => (
        <GlassCard key={i} style={styles.transcriptCard}>
          <View style={styles.cardContent}>
            <View style={styles.skeletonHeader}>
              <View>
                <View style={[styles.skeleton, styles.skeletonTitle]} />
                <View style={[styles.skeleton, styles.skeletonMeta]} />
              </View>
              <View style={[styles.skeleton, styles.skeletonBadge]} />
            </View>
            <View style={styles.skeletonStats}>
              <View style={[styles.skeleton, styles.skeletonStat]} />
              <View style={[styles.skeleton, styles.skeletonStat]} />
            </View>
            <View style={[styles.skeleton, styles.skeletonTranscription]} />
          </View>
        </GlassCard>
      ))}
    </View>
  );
}

// Empty state component
function EmptyState({ filter, query }: { filter?: string; query?: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="filter" size={32} color="rgba(255, 255, 255, 0.5)" />
      </View>
      <ThemedText style={styles.emptyTitle}>No recordings found</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        {query ? (
          `No results match your search for "${query}"`
        ) : filter ? (
          `No ${filter === 'needs-improvement' ? 'needs improvement' : filter} recordings found`
        ) : (
          "You haven't recorded any conversations yet"
        )}
      </ThemedText>

      <Button
        title="Back to Dashboard"
        onPress={() => router.push('/dashboard')}
        variant="secondary"
        style={styles.emptyButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filtersContainer: {
    gap: 16,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
  },
  transcriptsList: {
    gap: 16,
  },
  transcriptCard: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metaSeparator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 8,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  transcriptionPreview: {
    marginBottom: 16,
  },
  transcriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  viewTranscriptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewTranscriptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  // Skeleton styles
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  skeletonTitle: {
    width: 200,
    height: 20,
    marginBottom: 8,
  },
  skeletonMeta: {
    width: 120,
    height: 16,
  },
  skeletonBadge: {
    width: 60,
    height: 24,
    borderRadius: 12,
  },
  skeletonStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  skeletonStat: {
    width: 100,
    height: 16,
  },
  skeletonTranscription: {
    width: '100%',
    height: 40,
  },
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
});
