import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Mock data for transcripts
const mockTranscripts = [
  {
    id: '1',
    title: 'Team Meeting',
    date: '2023-06-15',
    duration: '25:30',
    positiveScore: 75,
  },
  {
    id: '2',
    title: 'Client Presentation',
    date: '2023-06-10',
    duration: '18:45',
    positiveScore: 82,
  },
  {
    id: '3',
    title: 'Performance Review',
    date: '2023-06-05',
    duration: '32:15',
    positiveScore: 68,
  },
];

export default function Transcripts() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Your Transcripts</ThemedText>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <ThemedText style={styles.filterText}>Recent</ThemedText>
            <IconSymbol name="chevron.down" size={16} color="#0070f3" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {mockTranscripts.length > 0 ? (
          mockTranscripts.map(transcript => (
            <TouchableOpacity key={transcript.id} style={styles.transcriptCard}>
              <View style={styles.transcriptHeader}>
                <ThemedText type="defaultSemiBold">{transcript.title}</ThemedText>
                <View style={[
                  styles.scoreIndicator,
                  { backgroundColor: getScoreColor(transcript.positiveScore) }
                ]}>
                  <ThemedText style={styles.scoreText}>{transcript.positiveScore}%</ThemedText>
                </View>
              </View>
              
              <View style={styles.transcriptDetails}>
                <View style={styles.detailItem}>
                  <IconSymbol name="calendar" size={16} color="#888888" />
                  <ThemedText style={styles.detailText}>{transcript.date}</ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <IconSymbol name="clock" size={16} color="#888888" />
                  <ThemedText style={styles.detailText}>{transcript.duration}</ThemedText>
                </View>
              </View>
              
              <View style={styles.transcriptFooter}>
                <TouchableOpacity style={styles.viewButton}>
                  <ThemedText style={styles.viewButtonText}>View Analysis</ThemedText>
                  <IconSymbol name="arrow.right" size={16} color="#0070f3" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={48} color="#888888" />
            <ThemedText style={styles.emptyText}>
              No transcripts yet. Start recording to see your transcripts here.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// Helper function to get color based on score
function getScoreColor(score: number): string {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  return '#F44336';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  filterText: {
    marginRight: 4,
    color: '#0070f3',
  },
  scrollView: {
    flex: 1,
  },
  transcriptCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transcriptDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    opacity: 0.7,
  },
  transcriptFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#0070f3',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
});
