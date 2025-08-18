import React from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { ThemedText } from '../ThemedText';
import { apiRequest } from '../../lib/apiService';

const { width } = Dimensions.get('window');

export function WordUsageStats() {
  // Use the billing cycle endpoint for accurate calculations
  const { data, isLoading } = useQuery({
    queryKey: ['usage-billing-cycle'],
    queryFn: () => apiRequest('/api/usage/billing-cycle'),
  });

  // Get current billing cycle recordings for additional info
  const { data: currentCycleRecordings, isLoading: isRecordingsLoading } = useQuery({
    queryKey: ['recordings-current-cycle'],
    queryFn: () => apiRequest('/api/recordings/current-cycle'),
    staleTime: 30000, // Cache for 30 seconds
  });

  if (isLoading) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Word Usage</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading usage stats...</ThemedText>
        </View>
      </GlassCard>
    );
  }

  // Get billing cycle data directly from server
  const currentBillingCycleUsage = data?.currentUsage || 0;
  const wordLimit = data?.wordLimit || 0;
  const usagePercentage = data?.usagePercentage || 0;
  const hasExceededLimit = data?.hasExceededLimit || false;

  // Get billing cycle information from server
  const billingCycle = data?.billingCycle || {
    startDate: undefined,
    endDate: undefined,
    daysRemaining: 0,
  };

  // Extract recordings for recent activity
  const recordingsArray = currentCycleRecordings?.recordings || [];
  const recentRecordings = recordingsArray.slice(0, 5); // Show last 5 recordings

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Word Usage</ThemedText>
      </View>
      
      <View style={styles.content}>
        {/* Usage Overview */}
        <View style={styles.usageOverview}>
          <View style={styles.usageHeader}>
            <View style={styles.usageHeaderLeft}>
              <Feather name="package" size={16} color="#8A2BE2" />
              <ThemedText style={styles.planLabel}>Current Plan</ThemedText>
            </View>
            <View style={styles.usageHeaderRight}>
              <ThemedText style={styles.usageNumbers}>
                <ThemedText style={styles.currentUsage}>
                  {currentBillingCycleUsage.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.usageLimit}>
                  {' '} / {wordLimit ? wordLimit.toLocaleString() : 'N/A'} words
                </ThemedText>
              </ThemedText>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={usagePercentage / 100}
              height={12}
              style={styles.progressBar}
              progressColor={usagePercentage > 90 ? '#FF6B6B' : '#8A2BE2'}
            />
            <ThemedText style={styles.progressText}>
              {usagePercentage}% of your monthly word allocation used
            </ThemedText>
          </View>

          {/* Exceeded Limit Warning */}
          {hasExceededLimit && (
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={16} color="#FF6B6B" />
              <ThemedText style={styles.warningText}>
                You've exceeded your monthly word limit
              </ThemedText>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        {!isRecordingsLoading && recentRecordings.length > 0 && (
          <View style={styles.recentActivity}>
            <View style={styles.activityHeader}>
              <Feather name="trending-up" size={16} color="#8A2BE2" />
              <ThemedText style={styles.activityTitle}>Recent Recordings</ThemedText>
            </View>
            
            <View style={styles.recordingsList}>
              {recentRecordings.map((recording: any, index: number) => (
                <View key={recording.id || index} style={styles.recordingItem}>
                  <View style={styles.recordingInfo}>
                    <ThemedText style={styles.recordingTitle} numberOfLines={1}>
                      {recording.title || `Recording ${index + 1}`}
                    </ThemedText>
                    <ThemedText style={styles.recordingDate}>
                      {recording.formattedDate || 'N/A'}
                    </ThemedText>
                  </View>
                  <View style={styles.recordingWords}>
                    <ThemedText style={styles.wordCount}>
                      {(recording.wordCount || 0).toLocaleString()}
                    </ThemedText>
                    <ThemedText style={styles.wordLabel}>words</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Billing Cycle Info */}
        {billingCycle.daysRemaining > 0 && (
          <View style={styles.billingInfo}>
            <Feather name="calendar" size={16} color="#8A2BE2" />
            <ThemedText style={styles.billingText}>
              {billingCycle.daysRemaining} days remaining in current billing cycle
            </ThemedText>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    gap: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  usageOverview: {
    gap: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  usageHeaderRight: {
    alignItems: 'flex-end',
  },
  usageNumbers: {
    fontSize: 16,
  },
  currentUsage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  usageLimit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    marginVertical: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  recentActivity: {
    gap: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recordingsList: {
    gap: 12,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recordingInfo: {
    flex: 1,
    gap: 2,
  },
  recordingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  recordingDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  recordingWords: {
    alignItems: 'flex-end',
    gap: 2,
  },
  wordCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
  wordLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  billingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  billingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
