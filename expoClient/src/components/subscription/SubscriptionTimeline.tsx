import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '../ui/GlassCard';
import { ThemedText } from '../ThemedText';
import { theme } from '../../styles/theme';
import { apiRequest } from '../../lib/apiService';

// Format date to a readable format
function formatDate(date: string | Date | null) {
  if (!date) return 'Not available';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Calculate days between dates
function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

interface SubscriptionTimelineProps {
  data?: any;
  style?: any;
}

export function SubscriptionTimeline({ data: propData, style }: SubscriptionTimelineProps) {
  // Fetch subscription information if not provided via props
  const { data: fetchedData, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => apiRequest('/api/billing/subscriptions/current'),
    retry: 2,
    retryDelay: 1000,
    // Skip the query if data is provided via props
    enabled: !propData,
  });

  // Use prop data if provided, otherwise use fetched data
  const data = propData || fetchedData;
  const isLoading = !propData && queryLoading;
  const error = !propData && queryError;
  
  if (isLoading) {
    return (
      <GlassCard style={[styles.card, style]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Subscription Timeline</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading subscription details...</ThemedText>
        </View>
      </GlassCard>
    );
  }

  // Improved error handling with fallback
  if (error || !data) {
    return (
      <GlassCard style={[styles.card, style]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Subscription Timeline</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Unable to load subscription details. Please try again later.
          </ThemedText>
        </View>
      </GlassCard>
    );
  }

  // Extract subscription data safely
  let planCode = '';
  let subscriptionStartDate = new Date();
  let currentPeriodStart = new Date();
  let currentPeriodEnd = new Date();
  let amount = 0;
  let interval = 'month';
  let cancelAtPeriodEnd = false;
  let wordLimit = 0;
  
  // Handle different possible data structures from our API
  if (data.subscription) {
    planCode = data.subscription.plan || '';
    
    if (data.subscription.startDate) {
      subscriptionStartDate = new Date(data.subscription.startDate);
    }
    
    if (data.subscription.currentPeriodStart) {
      currentPeriodStart = new Date(data.subscription.currentPeriodStart);
    }
    
    if (data.subscription.currentPeriodEnd) {
      currentPeriodEnd = new Date(data.subscription.currentPeriodEnd);
    }
    
    amount = data.subscription.amount || 0;
    interval = data.subscription.interval || 'month';
    cancelAtPeriodEnd = data.subscription.cancelAtPeriodEnd || false;
    wordLimit = data.subscription.wordLimit || null;
  }
  
  // Calculate days remaining
  const today = new Date();
  const daysRemaining = getDaysBetween(today, currentPeriodEnd);
  
  return (
    <GlassCard style={[styles.card, style]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Subscription Timeline</ThemedText>
      </View>
      
      <View style={styles.content}>
        {/* Original start date */}
        <View style={styles.timelineItem}>
          <View style={styles.iconContainer}>
            <Feather name="calendar" size={20} color="#8A2BE2" />
          </View>
          <View style={styles.timelineContent}>
            <ThemedText style={styles.timelineTitle}>Subscription Created</ThemedText>
            <ThemedText style={styles.timelineDescription}>
              You first subscribed on <ThemedText style={styles.highlight}>{formatDate(subscriptionStartDate)}</ThemedText>
            </ThemedText>
          </View>
        </View>
        
        {/* Current billing period */}
        <View style={styles.timelineItem}>
          <View style={styles.iconContainer}>
            <Feather name="clock" size={20} color="#8A2BE2" />
          </View>
          <View style={styles.timelineContent}>
            <ThemedText style={styles.timelineTitle}>Current Billing Cycle</ThemedText>
            <ThemedText style={styles.timelineDescription}>
              From <ThemedText style={styles.highlight}>{formatDate(currentPeriodStart)}</ThemedText> to <ThemedText style={styles.highlight}>{formatDate(currentPeriodEnd)}</ThemedText>
            </ThemedText>
            {daysRemaining > 0 && (
              <ThemedText style={styles.daysRemaining}>
                <ThemedText style={styles.highlight}>{daysRemaining}</ThemedText> days remaining
              </ThemedText>
            )}
          </View>
        </View>
        
        {/* Plan information */}
        <View style={styles.timelineItem}>
          <View style={styles.iconContainer}>
            <Feather name="layout" size={20} color="#8A2BE2" />
          </View>
          <View style={styles.timelineContent}>
            <ThemedText style={styles.timelineTitle}>Plan Information</ThemedText>
            <ThemedText style={styles.timelineDescription}>
              <ThemedText style={styles.highlight}>{planCode || 'Starter'}</ThemedText> Plan
              {amount > 0 && (
                <ThemedText> - ${amount}/{interval}</ThemedText>
              )}
            </ThemedText>
            <ThemedText style={styles.timelineDescription}>
              <ThemedText style={styles.highlight}>{wordLimit ? wordLimit.toLocaleString() : "N/A"}</ThemedText> words per month
            </ThemedText>
            {cancelAtPeriodEnd && (
              <ThemedText style={styles.cancelWarning}>
                Your subscription will not renew after the current period ends
              </ThemedText>
            )}
          </View>
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
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  timelineContent: {
    flex: 1,
    gap: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  timelineDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '600',
    color: '#fff',
  },
  daysRemaining: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  cancelWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
});
