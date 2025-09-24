import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import {
  VictoryChart,
  VictoryBar,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
  VictoryTooltip,
  VictoryContainer,
  VictoryLabel,
} from 'victory-native';

import { AppLayout } from '../src/components/navigation/AppLayout';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Picker } from '../src/components/ui/Picker';
import { TabView } from '../src/components/ui/TabView';
import { ThemedText } from '../src/components/ThemedText';
import { apiRequest } from '../src/lib/apiService';
import { theme } from '../src/styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 80; // Account for padding

// Custom theme for Victory charts
const customTheme = {
  axis: {
    style: {
      axis: { stroke: 'rgba(255, 255, 255, 0.3)', strokeWidth: 1 },
      tickLabels: { 
        fill: 'rgba(255, 255, 255, 0.8)', 
        fontSize: 12,
        fontFamily: 'Inter'
      },
      grid: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1 },
    },
  },
  chart: {
    padding: { left: 60, top: 40, right: 40, bottom: 80 },
  },
};

type TimeBasedView = 'week' | 'month' | 'quarter' | 'year' | 'alltime';
type RecordingsCount = 10 | 20 | 50;

interface RecordingWithScore {
  id: string;
  title: string;
  date: string;
  score: number;
  leaderMatch?: string;
}

interface TimeRange {
  label: string;
  recordings: RecordingWithScore[];
  averageScore: number;
  improvement: number;
}

interface PeriodData {
  period: string;
  date: Date;
  score: number;
  count: number;
  isEmpty: boolean;
}

// Mock data for demonstration
const MOCK_RECORDINGS: RecordingWithScore[] = [
  {
    id: '1',
    title: 'Team Meeting Discussion',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    score: 82,
    leaderMatch: 'Steve Jobs'
  },
  {
    id: '2',
    title: 'Client Presentation',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    score: 91,
    leaderMatch: 'Brené Brown'
  },
  {
    id: '3',
    title: 'Weekly Standup',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    score: 45,
    leaderMatch: 'Simon Sinek'
  },
  {
    id: '4',
    title: 'Project Review',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    score: 67,
    leaderMatch: 'Steve Jobs'
  },
  {
    id: '5',
    title: 'Board Meeting',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    score: 78,
    leaderMatch: 'Brené Brown'
  },
  {
    id: '6',
    title: 'Team Retrospective',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    score: 55,
    leaderMatch: 'Simon Sinek'
  },
  {
    id: '7',
    title: 'Sales Pitch',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    score: 88,
    leaderMatch: 'Steve Jobs'
  },
  {
    id: '8',
    title: 'All Hands Meeting',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    score: 73,
    leaderMatch: 'Brené Brown'
  }
];

const timeBasedOptions = [
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'Last 90 Days', value: 'quarter' },
  { label: 'Last 365 Days', value: 'year' },
  { label: 'All Time', value: 'alltime' },
];

const recordingsCountOptions = [
  { label: 'Last 10 recordings', value: '10' },
  { label: 'Last 20 recordings', value: '20' },
  { label: 'Last 50 recordings', value: '50' },
];

const tabs = [
  { key: 'overview', title: 'Overview' },
  { key: 'trends', title: 'Trends' },
  { key: 'stats', title: 'Stats' },
];

export default function ProgressScreen() {
  const [timeBasedView, setTimeBasedView] = useState<TimeBasedView>('month');
  const [recordingsCount, setRecordingsCount] = useState<RecordingsCount>(10);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [allRecordings, setAllRecordings] = useState<RecordingWithScore[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([]);

  // For now, use mock data. In production, this would fetch from API
  const { data: recordings, isLoading, refetch } = useQuery<RecordingWithScore[]>({
    queryKey: ['/api/recordings'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return MOCK_RECORDINGS;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (recordings) {
      // Sort by date (newest first)
      const sortedRecordings = [...recordings].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAllRecordings(sortedRecordings);
      calculateTimeRanges(sortedRecordings);
    }
  }, [recordings]);

  const calculateTimeRanges = (processedRecordings: RecordingWithScore[]) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Filter recordings for each time range
    const last7Days = processedRecordings.filter(
      (r) => new Date(r.date) >= sevenDaysAgo
    );
    const last30Days = processedRecordings.filter(
      (r) => new Date(r.date) >= thirtyDaysAgo
    );
    const thisYear = processedRecordings.filter(
      (r) => new Date(r.date) >= startOfYear
    );
    const allTime = processedRecordings;

    // Calculate average scores and improvements
    const calculateAvgAndImprovement = (
      recordings: RecordingWithScore[]
    ): { averageScore: number; improvement: number } => {
      if (recordings.length === 0) return { averageScore: 0, improvement: 0 };

      const averageScore =
        recordings.reduce((sum, r) => sum + r.score, 0) / recordings.length;

      if (recordings.length >= 2) {
        const sorted = [...recordings].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const firstThirdCount = Math.max(1, Math.floor(sorted.length * 0.3));
        const lastThirdCount = Math.max(1, Math.floor(sorted.length * 0.3));

        const firstThird = sorted.slice(0, firstThirdCount);
        const lastThird = sorted.slice(sorted.length - lastThirdCount);

        const firstAvg =
          firstThird.reduce((sum, r) => sum + r.score, 0) / firstThird.length;
        const lastAvg =
          lastThird.reduce((sum, r) => sum + r.score, 0) / lastThird.length;

        const improvement =
          firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

        return { averageScore, improvement };
      }

      return { averageScore, improvement: 0 };
    };

    setTimeRanges([
      {
        label: 'Last 7 days',
        recordings: last7Days,
        ...calculateAvgAndImprovement(last7Days),
      },
      {
        label: 'Last 30 days',
        recordings: last30Days,
        ...calculateAvgAndImprovement(last30Days),
      },
      {
        label: 'This year',
        recordings: thisYear,
        ...calculateAvgAndImprovement(thisYear),
      },
      {
        label: 'All time',
        recordings: allTime,
        ...calculateAvgAndImprovement(allTime),
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Generate chart color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // Good (green)
    if (score >= 60) return '#84cc16'; // Above average (lime)
    if (score >= 40) return '#eab308'; // Average (yellow)
    if (score >= 20) return '#f97316'; // Below average (orange)
    return '#ef4444'; // Poor (red)
  };

  // Create time-based chart data
  const getTimeBasedChartData = (): PeriodData[] => {
    if (allRecordings.length === 0) return [];

    const now = new Date();
    let filteredRecordings: RecordingWithScore[] = [];
    let periodBoundaries: { start: Date; end: Date; label: string }[] = [];

    if (timeBasedView === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filteredRecordings = allRecordings.filter(
        (r) => new Date(r.date) >= sevenDaysAgo
      );

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const formatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        periodBoundaries.push({
          start: startDate,
          end: endDate,
          label: formatter.format(date),
        });
      }
    } else if (timeBasedView === 'month') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredRecordings = allRecordings.filter(
        (r) => new Date(r.date) >= thirtyDaysAgo
      );

      for (let i = 9; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(now.getDate() - i * 3);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 2);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const startFormatter = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const endFormatter = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const label = `${startFormatter.format(startDate)}-${endFormatter.format(endDate)}`;
        periodBoundaries.push({ start: startDate, end: endDate, label });
      }
    }
    // Add other time periods as needed...

    if (filteredRecordings.length === 0 || periodBoundaries.length === 0) return [];

    const result = periodBoundaries.map((period) => {
      const recordingsInPeriod = filteredRecordings.filter((recording) => {
        const recordingDate = new Date(recording.date);
        return recordingDate >= period.start && recordingDate <= period.end;
      });

      const scores = recordingsInPeriod.map((rec) => rec.score);
      const avgScore =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;

      return {
        period: period.label,
        date: period.start,
        score: avgScore,
        count: recordingsInPeriod.length,
        isEmpty: recordingsInPeriod.length === 0,
      };
    });

    return result;
  };

  // Get recording-based chart data
  const getRecordingsChartData = () => {
    if (allRecordings.length === 0) return [];

    const sortedRecordings = [...allRecordings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const lastNRecordings = sortedRecordings.slice(-recordingsCount);

    return lastNRecordings.map((recording, index) => ({
      x: index + 1,
      y: recording.score,
      label: recording.title.length > 15
        ? recording.title.substring(0, 15) + '...'
        : recording.title,
      fullTitle: recording.title,
      date: new Date(recording.date).toLocaleDateString(),
    }));
  };

  const renderOverviewTab = () => {
    const timeBasedChartData = getTimeBasedChartData();
    const recordingsChartData = getRecordingsChartData();

    return (
      <View style={styles.tabContent}>
        {/* Time-Based Progress Chart */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <ThemedText style={styles.cardTitle}>Progress Over Time</ThemedText>
              <ThemedText style={styles.cardDescription}>
                Your leadership score evolution by time period
              </ThemedText>
            </View>
            <Picker
              options={timeBasedOptions}
              selectedValue={timeBasedView}
              onValueChange={(value) => setTimeBasedView(value as TimeBasedView)}
            />
          </View>

          <View style={styles.chartContainer}>
            {timeBasedChartData.length > 0 ? (
              <VictoryChart
                width={chartWidth}
                height={300}
                padding={{ left: 60, top: 40, right: 40, bottom: 80 }}
                containerComponent={<VictoryContainer responsive={false} />}
              >
                <VictoryAxis
                  dependentAxis
                  domain={[0, 100]}
                  tickFormat={(t) => `${t}`}
                  style={{
                    axis: { stroke: 'rgba(255, 255, 255, 0.3)' },
                    tickLabels: { fill: 'rgba(255, 255, 255, 0.8)', fontSize: 12 },
                    grid: { stroke: 'rgba(255, 255, 255, 0.1)' },
                  }}
                />
                <VictoryAxis
                  fixLabelOverlap={true}
                  style={{
                    axis: { stroke: 'rgba(255, 255, 255, 0.3)' },
                    tickLabels: { 
                      fill: 'rgba(255, 255, 255, 0.8)', 
                      fontSize: 10,
                      angle: -45,
                    },
                  }}
                />
                <VictoryBar
                  data={timeBasedChartData.map(d => ({ x: d.period, y: d.score }))}
                  style={{
                    data: {
                      fill: ({ datum }) => getScoreColor(datum.y),
                      fillOpacity: 0.8,
                    },
                  }}
                  labelComponent={<VictoryTooltip />}
                />
              </VictoryChart>
            ) : (
              <View style={styles.emptyChart}>
                <Feather name="bar-chart-2" size={48} color="rgba(255, 255, 255, 0.3)" />
                <ThemedText style={styles.emptyChartText}>
                  No data available for this time period
                </ThemedText>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Recent Recordings Progress */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <ThemedText style={styles.cardTitle}>Recent Recordings</ThemedText>
              <ThemedText style={styles.cardDescription}>
                Your progress across your most recent recordings
              </ThemedText>
            </View>
            <Picker
              options={recordingsCountOptions}
              selectedValue={recordingsCount.toString()}
              onValueChange={(value) => setRecordingsCount(parseInt(value) as RecordingsCount)}
            />
          </View>

          <View style={styles.chartContainer}>
            {recordingsChartData.length > 0 ? (
              <VictoryChart
                width={chartWidth}
                height={300}
                padding={{ left: 60, top: 40, right: 40, bottom: 60 }}
                containerComponent={<VictoryContainer responsive={false} />}
              >
                <VictoryAxis
                  dependentAxis
                  domain={[0, 100]}
                  tickFormat={(t) => `${t}`}
                  style={{
                    axis: { stroke: 'rgba(255, 255, 255, 0.3)' },
                    tickLabels: { fill: 'rgba(255, 255, 255, 0.8)', fontSize: 12 },
                    grid: { stroke: 'rgba(255, 255, 255, 0.1)' },
                  }}
                />
                <VictoryAxis
                  style={{
                    axis: { stroke: 'rgba(255, 255, 255, 0.3)' },
                    tickLabels: { fill: 'rgba(255, 255, 255, 0.8)', fontSize: 12 },
                  }}
                />
                <VictoryLine
                  data={recordingsChartData}
                  style={{
                    data: { stroke: '#3B82F6', strokeWidth: 3 },
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
                <VictoryArea
                  data={recordingsChartData}
                  style={{
                    data: { 
                      fill: '#3B82F6', 
                      fillOpacity: 0.2,
                      stroke: 'transparent',
                    },
                  }}
                  animate={{
                    duration: 1000,
                    onLoad: { duration: 500 }
                  }}
                />
              </VictoryChart>
            ) : (
              <View style={styles.emptyChart}>
                <Feather name="trending-up" size={48} color="rgba(255, 255, 255, 0.3)" />
                <ThemedText style={styles.emptyChartText}>
                  No recordings available yet
                </ThemedText>
              </View>
            )}
          </View>
        </GlassCard>
      </View>
    );
  };

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      <ThemedText style={styles.sectionTitle}>Time Period Breakdown</ThemedText>
      
      <View style={styles.statsGrid}>
        {timeRanges.map((range) => (
          <GlassCard key={range.label} style={styles.statCard}>
            <View style={styles.statCardContent}>
              <ThemedText style={styles.statCardTitle}>{range.label}</ThemedText>
              <ThemedText style={styles.statCardSubtitle}>
                {range.recordings.length} recording{range.recordings.length !== 1 ? 's' : ''}
              </ThemedText>
              
              <View style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Average score:</ThemedText>
                <ThemedText style={styles.statValue}>
                  {range.averageScore.toFixed(1)}
                </ThemedText>
              </View>
              
              <View style={styles.statRow}>
                <ThemedText style={styles.statLabel}>Improvement:</ThemedText>
                <ThemedText
                  style={[
                    styles.statValue,
                    {
                      color: range.improvement > 0
                        ? '#22c55e'
                        : range.improvement < 0
                        ? '#ef4444'
                        : 'rgba(255, 255, 255, 0.9)',
                    },
                  ]}
                >
                  {range.improvement === 0
                    ? 'N/A'
                    : `${range.improvement > 0 ? '+' : ''}${range.improvement.toFixed(1)}%`}
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>
    </View>
  );

  const getTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'trends':
        return renderOverviewTab(); // For now, same as overview
      case 'stats':
        return renderStatsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (isLoading) {
    return (
      <AppLayout
        showBackButton
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        pageTitle="Your Progress"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>Loading your progress...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      showBackButton
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="Your Progress"
    >
      <StatusBar style="light" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ThemedText style={styles.subtitle}>
          Track your communication improvement over time
        </ThemedText>

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

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
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
  tabContent: {
    gap: 24,
  },
  chartCard: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 0,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chartContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChartText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    marginBottom: 0,
  },
  statCardContent: {
    padding: 20,
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
