import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { H1, H2, H3, Paragraph, SmallText } from '../components/ui/Typography';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { colors } from '../theme/colors';

// Mock data
const recentRecordings = [
  {
    id: 1,
    title: 'Team Meeting Discussion',
    date: '2025-05-27',
    duration: 1800, // 30 minutes in seconds
    positivePercentage: 65,
    negativePercentage: 15,
    neutralPercentage: 20,
  },
  {
    id: 2,
    title: 'Client Presentation Prep',
    date: '2025-05-25',
    duration: 1200, // 20 minutes in seconds
    positivePercentage: 70,
    negativePercentage: 10,
    neutralPercentage: 20,
  },
];

const insights = [
  'You use inclusive language in 75% of your communications',
  'Your speaking pace is optimal for listener comprehension',
  'Consider using more open-ended questions in discussions',
];

export default function DashboardScreen() {
  const navigation = useNavigation();

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <H1>Dashboard</H1>
        <Paragraph style={styles.subtitle}>
          Welcome back! Here's an overview of your communication progress.
        </Paragraph>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Recording')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="mic" size={24} color="white" />
          </View>
          <SmallText style={styles.actionText}>Record</SmallText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Transcripts')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#4f46e5' }]}>
            <MaterialIcons name="list" size={24} color="white" />
          </View>
          <SmallText style={styles.actionText}>Transcripts</SmallText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Training')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#0891b2' }]}>
            <MaterialIcons name="school" size={24} color="white" />
          </View>
          <SmallText style={styles.actionText}>Training</SmallText>
        </TouchableOpacity>
      </View>

      {/* Recent Recordings */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>Recent Recordings</H2>
        </CardHeader>
        <CardContent>
          {recentRecordings.length > 0 ? (
            recentRecordings.map((recording, index) => (
              <React.Fragment key={recording.id}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('TranscriptView', { id: recording.id })}
                >
                  <View style={styles.recordingItem}>
                    <View style={styles.recordingInfo}>
                      <H3 style={styles.recordingTitle}>{recording.title}</H3>
                      <View style={styles.recordingMeta}>
                        <SmallText>{formatDate(recording.date)}</SmallText>
                        <View style={styles.dot} />
                        <SmallText>{formatDuration(recording.duration)}</SmallText>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
                {index < recentRecordings.length - 1 && <Separator />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="mic-none" size={48} color={colors.mutedForeground} />
              <Paragraph style={styles.emptyStateText}>No recordings yet</Paragraph>
              <SmallText style={styles.emptyStateSubtext}>
                Start by recording a conversation to get insights
              </SmallText>
            </View>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onPress={() => navigation.navigate('Transcripts')}
            style={styles.viewAllButton}
          >
            View All Recordings
          </Button>
        </CardFooter>
      </Card>

      {/* Communication Insights */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>Communication Insights</H2>
        </CardHeader>
        <CardContent>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
              <Paragraph style={styles.insightText}>{insight}</Paragraph>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Start Recording CTA */}
      <Card style={[styles.card, styles.ctaCard]}>
        <CardContent style={styles.ctaContent}>
          <MaterialIcons name="mic" size={36} color={colors.primary} />
          <H2 style={styles.ctaTitle}>Ready to improve?</H2>
          <Paragraph style={styles.ctaText}>
            Record a conversation to get AI-powered insights on your communication style.
          </Paragraph>
          <Button 
            onPress={() => navigation.navigate('Recording')}
            style={styles.ctaButton}
          >
            Start Recording
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  subtitle: {
    color: colors.mutedForeground,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: colors.foreground,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingTitle: {
    marginBottom: 4,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mutedForeground,
    marginHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    textAlign: 'center',
  },
  viewAllButton: {
    width: '100%',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
  },
  ctaCard: {
    backgroundColor: colors.accent,
  },
  ctaContent: {
    alignItems: 'center',
    padding: 24,
  },
  ctaTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  ctaText: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.mutedForeground,
  },
  ctaButton: {
    minWidth: 200,
  },
});
