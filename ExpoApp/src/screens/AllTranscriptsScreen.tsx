import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

// Define the transcript type
interface Transcript {
  id: number;
  title: string;
  date: string;
  duration: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

export default function AllTranscriptsScreen() {
  const navigation = useNavigation();
  
  // Fetch transcripts
  const { data: transcripts = [], isLoading } = useQuery({
    queryKey: ['transcripts'],
    queryFn: () => apiRequest<Transcript[]>('GET', '/api/recordings'),
  });

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render a transcript card
  const renderTranscriptCard = ({ item }: { item: Transcript }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('TranscriptView', { id: item.id })}>
      <Card.Content>
        <Title>{item.title || `Recording ${item.id}`}</Title>
        <Paragraph>{formatDate(item.date)} • {formatDuration(item.duration)}</Paragraph>
        
        <View style={styles.percentageContainer}>
          <View style={styles.percentageRow}>
            <Text style={styles.percentageLabel}>Positive:</Text>
            <View style={styles.percentageBarContainer}>
              <View 
                style={[
                  styles.percentageBar, 
                  styles.positiveBar,
                  { width: `${item.positivePercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.percentageValue}>{item.positivePercentage}%</Text>
          </View>
          
          <View style={styles.percentageRow}>
            <Text style={styles.percentageLabel}>Negative:</Text>
            <View style={styles.percentageBarContainer}>
              <View 
                style={[
                  styles.percentageBar, 
                  styles.negativeBar,
                  { width: `${item.negativePercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.percentageValue}>{item.negativePercentage}%</Text>
          </View>
          
          <View style={styles.percentageRow}>
            <Text style={styles.percentageLabel}>Neutral:</Text>
            <View style={styles.percentageBarContainer}>
              <View 
                style={[
                  styles.percentageBar, 
                  styles.neutralBar,
                  { width: `${item.neutralPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.percentageValue}>{item.neutralPercentage}%</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate('TranscriptView', { id: item.id })}>
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centered}>
          <Text>Loading transcripts...</Text>
        </View>
      ) : transcripts.length === 0 ? (
        <View style={styles.centered}>
          <Text>No transcripts found. Record a conversation to get started.</Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Recording')}
            style={styles.button}
          >
            Go to Recording
          </Button>
        </View>
      ) : (
        <FlatList
          data={transcripts}
          renderItem={renderTranscriptCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
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
    padding: 20,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
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
  positiveBar: {
    backgroundColor: '#4caf50',
  },
  negativeBar: {
    backgroundColor: '#f44336',
  },
  neutralBar: {
    backgroundColor: '#9e9e9e',
  },
  percentageValue: {
    width: 40,
    textAlign: 'right',
  },
  button: {
    marginTop: 16,
  },
});
