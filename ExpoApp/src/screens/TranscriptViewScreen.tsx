import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { H1, H2, H3, Paragraph, SmallText } from '../components/ui/Typography';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { colors } from '../theme/colors';

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
        return '#10b981'; // green
      case 'negative':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray for neutral
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingIndicator}>
          <MaterialIcons name="hourglass-top" size={48} color={colors.primary} />
          <H2 style={styles.loadingText}>Loading transcript...</H2>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <H1>{transcript.title}</H1>
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <MaterialIcons name="calendar-today" size={16} color={colors.mutedForeground} />
            <SmallText style={styles.metaText}>{formatDate(transcript.date)}</SmallText>
          </View>
          
          <View style={styles.metaItem}>
            <MaterialIcons name="access-time" size={16} color={colors.mutedForeground} />
            <SmallText style={styles.metaText}>{formatDuration(transcript.duration)}</SmallText>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transcript' && styles.activeTab]}
          onPress={() => setActiveTab('transcript')}
        >
          <MaterialIcons 
            name="chat" 
            size={20} 
            color={activeTab === 'transcript' ? colors.primary : colors.mutedForeground} 
          />
          <Paragraph style={[
            styles.tabText, 
            activeTab === 'transcript' && styles.activeTabText
          ]}>
            Transcript
          </Paragraph>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
        >
          <MaterialIcons 
            name="insights" 
            size={20} 
            color={activeTab === 'analysis' ? colors.primary : colors.mutedForeground} 
          />
          <Paragraph style={[
            styles.tabText, 
            activeTab === 'analysis' && styles.activeTabText
          ]}>
            Analysis
          </Paragraph>
        </TouchableOpacity>
      </View>

      {/* Transcript Tab */}
      {activeTab === 'transcript' && (
        <Card style={styles.card}>
          <CardContent>
            {transcript.segments.map((segment, index) => (
              <View key={segment.id} style={styles.segmentContainer}>
                <View style={styles.segmentHeader}>
                  <View style={styles.speakerContainer}>
                    <View 
                      style={[
                        styles.speakerIndicator, 
                        { backgroundColor: segment.speaker === 'You' ? colors.primary : '#6b7280' }
                      ]} 
                    />
                    <H3 style={styles.speakerName}>{segment.speaker}</H3>
                  </View>
                  <SmallText style={styles.timestamp}>{formatTimestamp(segment.start)}</SmallText>
                </View>
                
                <View style={[
                  styles.segmentContent,
                  { borderLeftColor: getSentimentColor(segment.sentiment) }
                ]}>
                  <Paragraph>{segment.text}</Paragraph>
                </View>
                
                {index < transcript.segments.length - 1 && <Separator />}
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <View>
          {/* Sentiment Analysis */}
          <Card style={styles.card}>
            <CardHeader>
              <H2>Sentiment Analysis</H2>
            </CardHeader>
            <CardContent>
              <View style={styles.sentimentContainer}>
                <View style={styles.sentimentItem}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: '#10b981' }]} />
                  <View style={styles.sentimentTextContainer}>
                    <Paragraph style={styles.sentimentLabel}>Positive</Paragraph>
                    <H3>{transcript.positivePercentage}%</H3>
                  </View>
                </View>
                
                <View style={styles.sentimentItem}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: '#ef4444' }]} />
                  <View style={styles.sentimentTextContainer}>
                    <Paragraph style={styles.sentimentLabel}>Negative</Paragraph>
                    <H3>{transcript.negativePercentage}%</H3>
                  </View>
                </View>
                
                <View style={styles.sentimentItem}>
                  <View style={[styles.sentimentIndicator, { backgroundColor: '#6b7280' }]} />
                  <View style={styles.sentimentTextContainer}>
                    <Paragraph style={styles.sentimentLabel}>Neutral</Paragraph>
                    <H3>{transcript.neutralPercentage}%</H3>
                  </View>
                </View>
              </View>
              
              <View style={styles.sentimentBarContainer}>
                <View style={styles.sentimentBar}>
                  <View 
                    style={[
                      styles.sentimentBarSegment, 
                      { 
                        backgroundColor: '#10b981',
                        flex: transcript.positivePercentage,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.sentimentBarSegment, 
                      { 
                        backgroundColor: '#ef4444',
                        flex: transcript.negativePercentage,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.sentimentBarSegment, 
                      { 
                        backgroundColor: '#6b7280',
                        flex: transcript.neutralPercentage,
                      }
                    ]} 
                  />
                </View>
              </View>
            </CardContent>
          </Card>
          
          {/* Strengths & Weaknesses */}
          <Card style={styles.card}>
            <CardHeader>
              <H2>Communication Insights</H2>
            </CardHeader>
            <CardContent>
              <H3 style={styles.insightTitle}>Strengths</H3>
              {transcript.analysis.strengths.map((strength, index) => (
                <View key={index} style={styles.insightItem}>
                  <MaterialIcons name="check-circle" size={20} color="#10b981" />
                  <Paragraph style={styles.insightText}>{strength}</Paragraph>
                </View>
              ))}
              
              <Separator />
              
              <H3 style={styles.insightTitle}>Areas for Improvement</H3>
              {transcript.analysis.weaknesses.map((weakness, index) => (
                <View key={index} style={styles.insightItem}>
                  <MaterialIcons name="info" size={20} color="#f59e0b" />
                  <Paragraph style={styles.insightText}>{weakness}</Paragraph>
                </View>
              ))}
            </CardContent>
          </Card>
          
          {/* Leadership Alternatives */}
          <Card style={styles.card}>
            <CardHeader>
              <H2>Leadership Alternatives</H2>
            </CardHeader>
            <CardContent>
              {transcript.analysis.leaderAlternatives.map((alternative, index) => (
                <View key={index} style={styles.alternativeContainer}>
                  <View style={styles.alternativeHeader}>
                    <H3 style={styles.alternativeLeader}>{alternative.leaderName}</H3>
                  </View>
                  
                  <View style={styles.alternativeContent}>
                    <View style={styles.alternativeSection}>
                      <SmallText style={styles.alternativeLabel}>You said:</SmallText>
                      <Paragraph style={styles.alternativeText}>{alternative.originalText}</Paragraph>
                    </View>
                    
                    <View style={styles.alternativeArrow}>
                      <MaterialIcons name="arrow-downward" size={24} color={colors.mutedForeground} />
                    </View>
                    
                    <View style={styles.alternativeSection}>
                      <SmallText style={styles.alternativeLabel}>{alternative.leaderName} might say:</SmallText>
                      <Paragraph style={[styles.alternativeText, styles.alternativeSuggestion]}>
                        {alternative.alternativeText}
                      </Paragraph>
                    </View>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    color: colors.mutedForeground,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    marginLeft: 8,
    color: colors.mutedForeground,
  },
  activeTabText: {
    color: colors.primary,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 24,
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
    fontWeight: '600',
  },
  timestamp: {
    color: colors.mutedForeground,
  },
  segmentContent: {
    paddingLeft: 12,
    borderLeftWidth: 2,
    marginLeft: 6,
  },
  sentimentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sentimentItem: {
    alignItems: 'center',
    flex: 1,
  },
  sentimentIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sentimentTextContainer: {
    alignItems: 'center',
  },
  sentimentLabel: {
    color: colors.mutedForeground,
    marginBottom: 4,
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
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    marginLeft: 12,
    flex: 1,
  },
  alternativeContainer: {
    marginBottom: 24,
  },
  alternativeHeader: {
    marginBottom: 12,
  },
  alternativeLeader: {
    color: colors.primary,
  },
  alternativeContent: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 16,
  },
  alternativeSection: {
    marginBottom: 16,
  },
  alternativeLabel: {
    marginBottom: 4,
    color: colors.mutedForeground,
  },
  alternativeText: {
    fontStyle: 'italic',
  },
  alternativeSuggestion: {
    color: colors.primary,
  },
  alternativeArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
});
