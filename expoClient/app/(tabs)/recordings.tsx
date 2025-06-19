import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/src/hooks/useColorScheme';

export default function RecordingsScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const [recordings, setRecordings] = useState([]);
  
  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Your Recordings</ThemedText>
          <ThemedText style={styles.subtitle}>
            View and analyze your past conversations
          </ThemedText>
        </View>
        
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">Recent Recordings</ThemedText>
            <TouchableOpacity style={styles.filterButton}>
              <FontAwesome name="filter" size={16} color={textColor} />
              <ThemedText style={styles.filterText}>Filter</ThemedText>
            </TouchableOpacity>
          </View>
          
          {recordings.length > 0 ? (
            recordings.map((recording, index) => (
              <ThemedView key={index} style={styles.recordingItem}>
                <ThemedText>Recording Item</ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedView style={styles.emptyState}>
              <FontAwesome 
                name="microphone" 
                size={48} 
                color={colorScheme === 'dark' ? '#555' : '#ccc'} 
              />
              <ThemedText style={styles.emptyText}>
                No recordings yet
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Start recording your conversations to get feedback and improve your communication skills
              </ThemedText>
              <TouchableOpacity style={styles.recordButton}>
                <FontAwesome name="microphone" size={16} color="#fff" />
                <ThemedText style={styles.recordButtonText}>
                  Start Recording
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginVertical: 16,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    marginLeft: 6,
  },
  recordingItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0070f3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  recordButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
