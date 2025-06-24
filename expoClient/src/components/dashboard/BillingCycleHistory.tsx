import React from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';
import { ThemedText } from '../ThemedText';
import { apiRequest } from '../../lib/apiClient';

interface BillingCycleData {
  cycleLabel: string;
  cycleStart: string;
  cycleEnd: string;
  wordsUsed: number;
  wordLimit: number;
  usagePercentage: number;
  isCurrent: boolean;
}

export function BillingCycleHistory() {
  // Get current subscription to determine billing cycle dates
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => apiRequest('/api/billing/subscriptions/current'),
  });

  // Get historical billing cycle data (6 monthly cycles)
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['usage-billing-cycle-history'],
    queryFn: () => apiRequest('/api/usage/billing-cycle?monthlyCycles=6'),
  });

  // Check if we have valid subscription data
  const hasValidSubscription = subscriptionData?.success && subscriptionData.subscription;

  if (isLoading) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Feather name="trending-up" size={20} color="#8A2BE2" />
            <ThemedText style={styles.title}>Billing Cycle History</ThemedText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading billing history...</ThemedText>
        </View>
      </GlassCard>
    );
  }

  if (!hasValidSubscription || !historicalData?.success || !historicalData?.historicalCycles) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Feather name="trending-up" size={20} color="#8A2BE2" />
            <ThemedText style={styles.title}>Billing Cycle History</ThemedText>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={48} color="rgba(255, 255, 255, 0.3)" />
          <ThemedText style={styles.emptyTitle}>No subscription data available</ThemedText>
          <ThemedText style={styles.emptyDescription}>
            Please set up your subscription to view billing cycle history
          </ThemedText>
        </View>
      </GlassCard>
    );
  }

  const historicalCycles = historicalData.historicalCycles;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="trending-up" size={20} color="#8A2BE2" />
          <ThemedText style={styles.title}>Billing Cycle History</ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>
          Word usage across your last {historicalCycles.length} billing cycles
        </ThemedText>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {historicalCycles.map((cycle: BillingCycleData, index: number) => (
          <View key={index} style={styles.cycleCard}>
            <View style={styles.cycleHeader}>
              <ThemedText style={styles.cycleLabel}>{cycle.cycleLabel}</ThemedText>
              {cycle.isCurrent && (
                <View style={styles.currentBadge}>
                  <ThemedText style={styles.currentBadgeText}>Current</ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.cycleDates}>
              <ThemedText style={styles.dateText}>
                {new Date(cycle.cycleStart).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
                {' - '}
                {new Date(cycle.cycleEnd).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </ThemedText>
            </View>

            <View style={styles.usageStats}>
              <View style={styles.usageNumbers}>
                <ThemedText style={styles.wordsUsed}>
                  {cycle.wordsUsed.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.wordLimit}>
                  / {cycle.wordLimit.toLocaleString()}
                </ThemedText>
              </View>
              
              <ProgressBar
                progress={cycle.usagePercentage / 100}
                height={8}
                style={styles.progressBar}
                progressColor={
                  cycle.usagePercentage > 90 
                    ? '#FF6B6B' 
                    : cycle.usagePercentage > 70 
                    ? '#FFA500' 
                    : '#8A2BE2'
                }
              />
              
              <ThemedText style={styles.percentageText}>
                {cycle.usagePercentage}% used
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Average Usage</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {Math.round(
              historicalCycles.reduce((sum: number, cycle: BillingCycleData) => 
                sum + cycle.usagePercentage, 0
              ) / historicalCycles.length
            )}%
          </ThemedText>
        </View>
        
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Peak Usage</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {Math.max(...historicalCycles.map((cycle: BillingCycleData) => cycle.usagePercentage))}%
          </ThemedText>
        </View>
        
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>Total Words</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {historicalCycles.reduce((sum: number, cycle: BillingCycleData) => 
              sum + cycle.wordsUsed, 0
            ).toLocaleString()}
          </ThemedText>
        </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 16,
  },
  cycleCard: {
    width: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cycleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  currentBadge: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cycleDates: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  usageStats: {
    gap: 8,
  },
  usageNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  wordsUsed: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  wordLimit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBar: {
    marginVertical: 4,
  },
  percentageText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A2BE2',
  },
});
