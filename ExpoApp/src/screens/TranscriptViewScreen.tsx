import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import BottomNavigation from '../components/ui/BottomNavigation';
import GradientCard from '../components/ui/GradientCard';

// Mock data for transcript
const mockTranscript = {
  id: 1,
  title: 'Team Meeting Discussion',
  date: '2025-05-27',
  duration: 1800, // 30 minutes in seconds
  positivePercentage: 65,
  negativePercentage: 15,
  neutralPercentage: 20,
  segments: [
    {
      id: 1,
      start: 0,
      end: 15,
      text: "Good morning everyone. Let's get started with our weekly team meeting.",
      speaker: 'You',
      sentiment: 'positive',
    },
    {
      id: 2,
      start: 16,
      end: 30,
      text: "Thanks for organizing this. I have a few updates from the marketing team.",
      speaker: 'Speaker 2',
      sentiment: 'neutral',
    },
    {
      id: 3,
      start: 31,
      end: 60,
      text: "I'm concerned about the timeline for the new product launch. We're falling behind schedule.",
      speaker: 'Speaker 3',
      sentiment: 'negative',
    },
    {
      id: 4,
      start: 61,
      end: 90,
      text: "I understand your concern. Let's work together to find a solution. What specific challenges are you facing?",
      speaker: 'You',
      sentiment: 'positive',
    },
    {
      id: 5,
      start: 91,
      end: 120,
      text: "The design team is waiting on final requirements from product management. We can't proceed without those specifications.",
      speaker: 'Speaker 3',
      sentiment: 'neutral',
    },
  ],
  analysis: {
    strengths: [
      'Effective use of open-ended questions',
      'Positive and solution-oriented language',
      'Good active listening skills',
    ],
    weaknesses: [
      'Could provide more specific acknowledgment of concerns',
      'Meeting structure could be more clearly defined',
    ],
    leaderAlternatives: [
      {
        leaderId: 1,
        leaderName: 'Barack Obama',
        originalText: "I understand your concern. Let's work together to find a solution.",
        alternativeText: "I hear your concern, and it's valid. Let me assure you that we're going to tackle this challenge together as a team.",
        segmentId: 4,
      },
    ],
  },
};

export default function TranscriptViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || { id: 1 };
  const [transcript, setTranscript] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transcript');
  const [navTab, setNavTab] = useState('progress');
  
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header animation style
  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - (scrollY.value * 0.01 > 0.6 ? 0.6 : scrollY.value * 0.01),
      transform: [{ translateY: scrollY.value > 100 ? -100 : 0 }],
    };
  });

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format timestamp for transcript segments
  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return colors.success;
      case 'negative':
        return colors.error;
      default:
        return colors.textMuted; // gray for neutral
    }
  };

  // Fetch transcript data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTranscript(mockTranscript);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const handleTabChange = (tab: string) => {
    setNavTab(tab);
    
    // Navigate to the appropriate screen based on the tab
    switch (tab) {
      case 'home':
        navigation.navigate('Dashboard');
        break;
      case 'explore':
        // Navigate to explore screen when implemented
        break;
      case 'sessions':
        navigation.navigate('Recording');
        break;
      case 'progress':
        navigation.navigate('Transcripts');
        break;
      case 'profile':
        navigation.navigate('Settings');
        break;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingText}>Loading transcript...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => navigation.navigate('Transcripts')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transcript</Text>
        <View style={{ width: 50 }} />
      </Animated.View>

      {/* Transcript Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{transcript.title}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{formatDate(transcript.date)}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🕒</Text>
            <Text style={styles.metaText}>{formatDuration(transcript.duration)}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transcript' && styles.activeTab]}
          onPress={() => setActiveTab('transcript')}
        >
          <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>
            Transcript
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <View style={styles.transcriptContainer}>
            {transcript.segments.map((segment, index) => (
              <View key={segment.id} style={styles.segmentContainer}>
                <View style={styles.segmentHeader}>
                  <View style={styles.speakerContainer}>
                    <View 
                      style={[
                        styles.speakerIndicator, 
                        { backgroundColor: segment.speaker === 'You' ? colors.primary : colors.textMuted }
                      ]} 
                    />
                    <Text style={styles.speakerName}>{segment.speaker}</Text>
                  </View>
                  <Text style={styles.timestamp}>{formatTimestamp(segment.start)}</Text>
                </View>
                
                <View style={[
                  styles.segmentContent,
                  { borderLeftColor: getSentimentColor(segment.sentiment) }
                ]}>
                  <Text style={styles.segmentText}>{segment.text}</Text>
                </View>
                
                {index < transcript.segments.length - 1 && (
                  <View style={styles.segmentDivider} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <View style={styles.analysisContainer}>
            {/* Sentiment Analysis */}
            <GradientCard style={styles.analysisCard}>
              <Text style={styles.cardTitle}>Sentiment Analysis</Text>
              
              <View style={styles.sentimentStats}>
                <View style={styles.sentimentStat}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: colors.success }]} />
                  <View>
                    <Text style={styles.sentimentLabel}>Positive</Text>
                    <Text style={styles.sentimentValue}>{transcript.positivePercentage}%</Text>
                  </View>
                </View>
                
                <View style={styles.sentimentStat}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: colors.error }]} />
                  <View>
                    <Text style={styles.sentimentLabel}>Negative</Text>
                    <Text style={styles.sentimentValue}>{transcript.negativePercentage}%</Text>
                  </View>
                </View>
                
                <View style={styles.sentimentStat}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: colors.textMuted }]} />
                  <View>
                    <Text style={styles.sentimentLabel}>Neutral</Text>
                    <Text style={styles.sentimentValue}>{transcript.neutralPercentage}%</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.sentimentBarContainer}>
                <View style={styles.sentimentBar}>
                  <View 
                    style={[
                      styles.sentimentBarSegment, 
                      { 
                        backgroundColor: colors.success,
                        flex: transcript.positivePercentage,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.sentimentBarSegment, 
                      { 
                        backgroundColor: colors.error,
                        flex: transcript.negativePercentage,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.sentimentBarSegment, 
                      { 
                        backgroundColor: colors.textMuted,
                        flex: transcript.neutralPercentage,
                      }
                    ]} 
                  />
                </View>
              </View>
            </GradientCard>
            
            {/* Strengths & Weaknesses */}
            <GradientCard style={styles.analysisCard}>
              <Text style={styles.cardTitle}>Communication Insights</Text>
              
              <Text style={styles.insightTitle}>Strengths</Text>
              {transcript.analysis.strengths.map((strength, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightIcon}>✅</Text>
                  <Text style={styles.insightText}>{strength}</Text>
                </View>
              ))}
              
              <View style={styles.divider} />
              
              <Text style={styles.insightTitle}>Areas for Improvement</Text>
              {transcript.analysis.weaknesses.map((weakness, index) => (
                <View key={index} style={styles.insightItem}>
                  <Text style={styles.insightIcon}>ℹ️</Text>
                  <Text style={styles.insightText}>{weakness}</Text>
                </View>
              ))}
            </GradientCard>
            
            {/* Leadership Alternatives */}
            <GradientCard style={styles.analysisCard}>
              <Text style={styles.cardTitle}>Leadership Alternatives</Text>
              
              {transcript.analysis.leaderAlternatives.map((alternative, index) => (
                <View key={index} style={styles.alternativeContainer}>
                  <View style={styles.alternativeHeader}>
                    <Text style={styles.alternativeLeader}>{alternative.leaderName}</Text>
                  </View>
                  
                  <View style={styles.alternativeContent}>
                    <View style={styles.alternativeSection}>
                      <Text style={styles.alternativeLabel}>You said:</Text>
                      <Text style={styles.alternativeText}>{alternative.originalText}</Text>
                    </View>
                    
                    <View style={styles.alternativeArrow}>
                      <Text style={styles.alternativeArrowIcon}>⬇️</Text>
                    </View>
                    
                    <View style={styles.alternativeSection}>
                      <Text style={styles.alternativeLabel}>{alternative.leaderName} might say:</Text>
                      <Text style={[styles.alternativeText, styles.alternativeSuggestion]}>
                        {alternative.alternativeText}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </GradientCard>
          </View>
        )}

        {/* Add some space at the bottom for the navigation bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={navTab}
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: colors.navActive,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  transcriptContainer: {
    paddingHorizontal: 24,
  },
  segmentContainer: {
    marginBottom: 16,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 14,
    color: colors.textMuted,
  },
  segmentContent: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    marginLeft: 6,
  },
  segmentText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  analysisContainer: {
    paddingHorizontal: 24,
  },
  analysisCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  sentimentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sentimentStat: {
    alignItems: 'center',
    flex: 1,
  },
  sentimentIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sentimentLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  sentimentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sentimentBarContainer: {
    marginBottom: 8,
  },
  sentimentBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sentimentBarSegment: {
    height: '100%',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  insightText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  alternativeContainer: {
    marginBottom: 16,
  },
  alternativeHeader: {
    marginBottom: 12,
  },
  alternativeLeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  alternativeContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  alternativeSection: {
    marginBottom: 12,
  },
  alternativeLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  alternativeText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  alternativeSuggestion: {
    color: colors.primary,
  },
  alternativeArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  alternativeArrowIcon: {
    fontSize: 16,
  },
});
