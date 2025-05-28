import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Chip, Button, Divider } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

// Define the transcript detail type
interface TranscriptDetail {
  id: number;
  title: string;
  date: string;
  duration: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  segments: TranscriptSegment[];
  analysis: {
    strengths: string[];
    weaknesses: string[];
    leaderAlternatives: LeaderAlternative[];
  };
}

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface LeaderAlternative {
  leaderId: number;
  leaderName: string;
  originalText: string;
  alternativeText: string;
  segmentId: number;
}

type TranscriptViewRouteProp = RouteProp<{ TranscriptView: { id: number } }, 'TranscriptView'>;

export default function TranscriptViewScreen() {
  const route = useRoute<TranscriptViewRouteProp>();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<'transcript' | 'analysis'>('transcript');
  
  // Fetch transcript details
  const { data: transcript, isLoading } = useQuery({
    queryKey: ['transcript', id],
    queryFn: () => apiRequest<TranscriptDetail>('GET', `/api/recordings/${id}`),
  });

  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get color for sentiment
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  // Render transcript tab
  const renderTranscriptTab = () => (
    <ScrollView style={styles.tabContent}>
      {transcript?.segments.map((segment) => (
        <View key={segment.id} style={styles.segmentContainer}>
          <View style={styles.segmentHeader}>
            <Text style={styles.speakerText}>{segment.speaker}</Text>
            <Text style={styles.timeText}>{formatTime(segment.start)}</Text>
          </View>
          <View 
            style={[
              styles.segmentTextContainer, 
              { borderLeftColor: getSentimentColor(segment.sentiment) }
            ]}
          >
            <Text style={styles.segmentText}>{segment.text}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Render analysis tab
  const renderAnalysisTab = () => (
    <ScrollView style={styles.tabContent}>
      {transcript?.analysis && (
        <>
          <Card style={styles.analysisCard}>
            <Card.Content>
              <Title>Communication Strengths</Title>
              {transcript.analysis.strengths.map((strength, index) => (
                <Paragraph key={index} style={styles.analysisItem}>
                  • {strength}
                </Paragraph>
              ))}
            </Card.Content>
          </Card>
          
          <Card style={styles.analysisCard}>
            <Card.Content>
              <Title>Areas for Improvement</Title>
              {transcript.analysis.weaknesses.map((weakness, index) => (
                <Paragraph key={index} style={styles.analysisItem}>
                  • {weakness}
                </Paragraph>
              ))}
            </Card.Content>
          </Card>
          
          <Card style={styles.analysisCard}>
            <Card.Content>
              <Title>Leadership Alternatives</Title>
              {transcript.analysis.leaderAlternatives.map((alternative, index) => (
                <View key={index} style={styles.alternativeContainer}>
                  <Chip style={styles.leaderChip}>{alternative.leaderName}</Chip>
                  <Paragraph style={styles.originalText}>
                    Original: "{alternative.originalText}"
                  </Paragraph>
                  <Paragraph style={styles.alternativeText}>
                    Alternative: "{alternative.alternativeText}"
                  </Paragraph>
                  <Divider style={styles.divider} />
                </View>
              ))}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading transcript...</Text>
      </View>
    );
  }

  if (!transcript) {
    return (
      <View style={styles.centered}>
        <Text>Transcript not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title>{transcript.title || `Recording ${transcript.id}`}</Title>
          <Paragraph>{formatDate(transcript.date)} • {formatTime(transcript.duration)}</Paragraph>
          
          <View style={styles.percentageContainer}>
            <View style={styles.percentageRow}>
              <Text style={styles.percentageLabel}>Positive:</Text>
              <View style={styles.percentageBarContainer}>
                <View 
                  style={[
                    styles.percentageBar, 
                    { 
                      backgroundColor: '#4caf50',
                      width: `${transcript.positivePercentage}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.percentageValue}>{transcript.positivePercentage}%</Text>
            </View>
            
            <View style={styles.percentageRow}>
              <Text style={styles.percentageLabel}>Negative:</Text>
              <View style={styles.percentageBarContainer}>
                <View 
                  style={[
                    styles.percentageBar, 
                    { 
                      backgroundColor: '#f44336',
                      width: `${transcript.negativePercentage}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.percentageValue}>{transcript.negativePercentage}%</Text>
            </View>
            
            <View style={styles.percentageRow}>
              <Text style={styles.percentageLabel}>Neutral:</Text>
              <View style={styles.percentageBarContainer}>
                <View 
                  style={[
                    styles.percentageBar, 
                    { 
                      backgroundColor: '#9e9e9e',
                      width: `${transcript.neutralPercentage}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.percentageValue}>{transcript.neutralPercentage}%</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.tabsContainer}>
        <Button 
          mode={activeTab === 'transcript' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('transcript')}
          style={styles.tabButton}
        >
          Transcript
        </Button>
        <Button 
          mode={activeTab === 'analysis' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('analysis')}
          style={styles.tabButton}
        >
          Analysis
        </Button>
      </View>
      
      {activeTab === 'transcript' ? renderTranscriptTab() : renderAnalysisTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    margin: 16,
    elevation: 2,
  },
  percentageContainer: {
    marginTop: 12,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  percentageLabel: {
    width: 70,
  },
  percentageBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  percentageBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageValue: {
    width: 40,
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  segmentContainer: {
    marginBottom: 16,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  speakerText: {
    fontWeight: 'bold',
  },
  timeText: {
    color: '#757575',
  },
  segmentTextContainer: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  segmentText: {
    fontSize: 16,
    lineHeight: 24,
  },
  analysisCard: {
    marginBottom: 16,
  },
  analysisItem: {
    marginVertical: 4,
  },
  alternativeContainer: {
    marginVertical: 8,
  },
  leaderChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  originalText: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  alternativeText: {
    color: '#4caf50',
    marginBottom: 4,
  },
  divider: {
    marginTop: 8,
  },
});
