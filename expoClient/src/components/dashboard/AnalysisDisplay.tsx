import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

// Placeholder for the CommunicationChart component
// In a real app, you would implement this with a charting library like react-native-chart-kit
const CommunicationChart = () => (
  <View style={styles.chartPlaceholder}>
    <Text style={[styles.chartText, { color: theme.colors.foreground }]}>Communication Analysis Chart</Text>
    <Text style={styles.chartSubtext}>
      (This would be a real chart in the production app)
    </Text>
  </View>
);

// Helper function to format timestamp as MM:SS
function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to days/hours/minutes
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  }
}

// Helper function to format duration
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} minute${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
}

interface AnalysisDisplayProps {
  recording: any;
  leaders: any[];
}

export default function AnalysisDisplay({ recording, leaders }: AnalysisDisplayProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('positive');
  
  if (!recording || !recording.analysisResult) {
    return null;
  }
  
  const { title, recordedAt, duration, analysisResult } = recording;
  const { 
    timeline, 
    positiveInstances, 
    negativeInstances, 
    passiveInstances,
    leadershipInsights,
    overview
  } = analysisResult;
  
  // Format recording date
  const formattedDate = formatDate(recordedAt);
  
  // Format duration
  const formattedDuration = formatDuration(duration);
  
  // Get leader information for insights
  const getLeaderById = (leaderId: string) => {
    if (!leaders) return null;
    return leaders.find(leader => leader.id === leaderId);
  };
  
  // Get badge color based on rating
  const getBadgeColor = (rating: string) => {
    switch(rating) {
      case 'Good':
        return { bg: 'rgba(74, 222, 128, 0.2)', text: theme.colors.success };
      case 'Average':
        return { bg: 'rgba(250, 204, 21, 0.2)', text: theme.colors.warning };
      default:
        return { bg: 'rgba(248, 113, 113, 0.2)', text: theme.colors.error };
    }
  };
  
  const badgeColor = getBadgeColor(overview.rating);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Last Analysis</Text>
      
      <View style={styles.card}>
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>{title}</Text>
              <Text style={styles.cardSubtitle}>
                Recorded {formattedDate} ({formattedDuration})
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[styles.badgeText, { color: badgeColor.text }]}>
                {overview.rating} overall
              </Text>
            </View>
          </View>
          
          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Communication Analysis Chart */}
            <CommunicationChart />
            
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <View style={styles.tabsList}>
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'positive' && styles.activeTabButton
                  ]}
                  onPress={() => setActiveTab('positive')}
                >
                  <Text style={[
                    styles.tabButtonText,
                    activeTab === 'positive' && [styles.activeTabButtonText, { color: theme.colors.foreground }]
                  ]}>
                    Positive Moments
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'improve' && styles.activeTabButton
                  ]}
                  onPress={() => setActiveTab('improve')}
                >
                  <Text style={[
                    styles.tabButtonText,
                    activeTab === 'improve' && [styles.activeTabButtonText, { color: theme.colors.foreground }]
                  ]}>
                    Areas for Improvement
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tabButton, 
                    activeTab === 'leadership' && styles.activeTabButton
                  ]}
                  onPress={() => setActiveTab('leadership')}
                >
                  <Text style={[
                    styles.tabButtonText,
                    activeTab === 'leadership' && [styles.activeTabButtonText, { color: theme.colors.foreground }]
                  ]}>
                    Leadership Insights
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Tab Content */}
              <View style={styles.tabContent}>
                {activeTab === 'positive' && (
                  <View style={[styles.tabPanel, { backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.2)' }]}>
                    <View style={styles.tabPanelHeader}>
                      <Feather name="check-circle" size={16} color={theme.colors.success} />
                      <Text style={[styles.tabPanelTitle, { color: theme.colors.success }]}>
                        Positive Moments
                      </Text>
                    </View>
                    
                    <ScrollView style={styles.tabPanelContent}>
                      {positiveInstances && positiveInstances.length > 0 ? (
                        positiveInstances.map((instance: any, index: number) => (
                          <View key={index} style={styles.instanceItem}>
                            <Text style={[styles.instanceTimestamp, { color: theme.colors.success }]}>
                              {formatTimestamp(instance.timestamp)} -
                            </Text>
                            <Text style={[styles.instanceText, { color: 'rgba(74, 222, 128, 0.9)' }]}>
                              {instance.analysis}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.emptyMessage, { color: 'rgba(74, 222, 128, 0.9)' }]}>
                          No positive moments identified.
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
                
                {activeTab === 'improve' && (
                  <View style={[styles.tabPanel, { backgroundColor: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.2)' }]}>
                    <View style={styles.tabPanelHeader}>
                      <Feather name="alert-circle" size={16} color={theme.colors.error} />
                      <Text style={[styles.tabPanelTitle, { color: theme.colors.error }]}>
                        Areas for Improvement
                      </Text>
                    </View>
                    
                    <ScrollView style={styles.tabPanelContent}>
                      {negativeInstances && negativeInstances.length > 0 ? (
                        negativeInstances.map((instance: any, index: number) => (
                          <View key={index} style={styles.instanceItem}>
                            <Text style={[styles.instanceTimestamp, { color: theme.colors.error }]}>
                              {formatTimestamp(instance.timestamp)} -
                            </Text>
                            <Text style={[styles.instanceText, { color: 'rgba(248, 113, 113, 0.9)' }]}>
                              {instance.analysis}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.emptyMessage, { color: 'rgba(248, 113, 113, 0.9)' }]}>
                          No areas for improvement identified.
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
                
                {activeTab === 'leadership' && (
                  <View style={[styles.tabPanel, { backgroundColor: 'rgba(96, 165, 250, 0.1)', borderColor: 'rgba(96, 165, 250, 0.2)' }]}>
                    <View style={styles.tabPanelHeader}>
                      <Feather name="zap" size={16} color={theme.colors.info} />
                      <Text style={[styles.tabPanelTitle, { color: theme.colors.info }]}>
                        Leadership Insights
                      </Text>
                    </View>
                    
                    <ScrollView style={styles.tabPanelContent}>
                      {leadershipInsights && leadershipInsights.length > 0 ? (
                        leadershipInsights.map((insight: any, index: number) => {
                          const leader = getLeaderById(insight.leaderId);
                          return (
                            <View key={index} style={styles.insightItem}>
                              <Text style={[styles.insightLeader, { color: theme.colors.info }]}>
                                {leader?.name || insight.leaderName} would have:
                              </Text>
                              <Text style={[styles.insightText, { color: 'rgba(96, 165, 250, 0.9)' }]}>
                                {insight.advice}
                              </Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={[styles.emptyMessage, { color: 'rgba(96, 165, 250, 0.9)' }]}>
                          No leadership insights available.
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={styles.footerLink}
              onPress={() => router.push(`/transcript/${recording.id}`)}
            >
              <Text style={[styles.footerLinkText, { color: theme.colors.foreground }]}>View transcript</Text>
            </TouchableOpacity>
            
            <View style={styles.footerActions}>
              <TouchableOpacity 
                style={styles.footerAction}
                onPress={() => router.push(`/transcript/${recording.id}`)}
              >
                <Text style={styles.footerActionText}>Detailed analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.footerAction}
                onPress={() => router.push('/training')}
              >
                <Text style={styles.footerActionText}>Practice exercises</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  tabsContainer: {
    marginTop: 24,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabButtonText: {
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 16,
  },
  tabPanel: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  tabPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabPanelContent: {
    maxHeight: 200,
  },
  instanceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instanceTimestamp: {
    fontSize: 12,
    marginRight: 4,
  },
  instanceText: {
    fontSize: 12,
    flex: 1,
  },
  insightItem: {
    marginBottom: 12,
  },
  insightLeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
  },
  emptyMessage: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLink: {
    
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footerActions: {
    flexDirection: 'row',
  },
  footerAction: {
    marginLeft: 16,
  },
  footerActionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
