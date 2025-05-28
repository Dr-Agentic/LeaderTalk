import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { H1, H3, Paragraph, SmallText } from '../components/ui/Typography';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { colors } from '../theme/colors';

// Mock data for recordings
const mockRecordings = [
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
  {
    id: 3,
    title: 'Project Kickoff Meeting',
    date: '2025-05-20',
    duration: 2400, // 40 minutes in seconds
    positivePercentage: 60,
    negativePercentage: 20,
    neutralPercentage: 20,
  },
  {
    id: 4,
    title: 'One-on-One with Direct Report',
    date: '2025-05-18',
    duration: 1500, // 25 minutes in seconds
    positivePercentage: 75,
    negativePercentage: 5,
    neutralPercentage: 20,
  },
  {
    id: 5,
    title: 'Strategy Planning Session',
    date: '2025-05-15',
    duration: 3600, // 60 minutes in seconds
    positivePercentage: 55,
    negativePercentage: 25,
    neutralPercentage: 20,
  },
];

export default function AllTranscriptsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecordings, setFilteredRecordings] = useState(mockRecordings);

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

  // Handle search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredRecordings(mockRecordings);
    } else {
      const filtered = mockRecordings.filter(recording => 
        recording.title.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredRecordings(filtered);
    }
  };

  // Render sentiment indicator
  const renderSentimentIndicator = (positive: number, negative: number, neutral: number) => {
    return (
      <View style={styles.sentimentContainer}>
        <View style={[styles.sentimentBar, styles.sentimentPositive, { flex: positive }]} />
        <View style={[styles.sentimentBar, styles.sentimentNegative, { flex: negative }]} />
        <View style={[styles.sentimentBar, styles.sentimentNeutral, { flex: neutral }]} />
      </View>
    );
  };

  // Render recording item
  const renderRecordingItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TranscriptView', { id: item.id })}
    >
      <Card style={styles.recordingCard}>
        <CardContent>
          <View style={styles.recordingHeader}>
            <H3>{item.title}</H3>
            <MaterialIcons name="chevron-right" size={24} color={colors.mutedForeground} />
          </View>
          
          <View style={styles.recordingMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="calendar-today" size={16} color={colors.mutedForeground} />
              <SmallText style={styles.metaText}>{formatDate(item.date)}</SmallText>
            </View>
            
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color={colors.mutedForeground} />
              <SmallText style={styles.metaText}>{formatDuration(item.duration)}</SmallText>
            </View>
          </View>
          
          {renderSentimentIndicator(
            item.positivePercentage, 
            item.negativePercentage, 
            item.neutralPercentage
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery ? (
        <>
          <MaterialIcons name="search-off" size={48} color={colors.mutedForeground} />
          <Paragraph style={styles.emptyStateTitle}>No results found</Paragraph>
          <SmallText style={styles.emptyStateText}>
            Try adjusting your search query
          </SmallText>
        </>
      ) : (
        <>
          <MaterialIcons name="mic-none" size={48} color={colors.mutedForeground} />
          <Paragraph style={styles.emptyStateTitle}>No recordings yet</Paragraph>
          <SmallText style={styles.emptyStateText}>
            Start by recording a conversation to get insights
          </SmallText>
          <Button 
            onPress={() => navigation.navigate('Recording')}
            style={styles.emptyStateButton}
          >
            Start Recording
          </Button>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <H1>All Recordings</H1>
        <Paragraph style={styles.subtitle}>
          View and analyze your past conversations
        </Paragraph>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <Input
            placeholder="Search recordings..."
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
        </View>
        
        <Button
          variant="outline"
          onPress={() => navigation.navigate('Recording')}
          icon={<MaterialIcons name="add" size={20} color={colors.primary} />}
          style={styles.newButton}
        >
          New
        </Button>
      </View>
      
      <FlatList
        data={filteredRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 40,
    height: 44,
    marginBottom: 0,
  },
  newButton: {
    borderColor: colors.primary,
    height: 44,
  },
  listContainer: {
    padding: 24,
    paddingTop: 8,
  },
  recordingCard: {
    marginBottom: 16,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingMeta: {
    flexDirection: 'row',
    marginBottom: 16,
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
  sentimentContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sentimentBar: {
    height: '100%',
  },
  sentimentPositive: {
    backgroundColor: '#10b981', // green
  },
  sentimentNegative: {
    backgroundColor: '#ef4444', // red
  },
  sentimentNeutral: {
    backgroundColor: '#6b7280', // gray
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 48,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyStateText: {
    textAlign: 'center',
    color: colors.mutedForeground,
    marginBottom: 24,
  },
  emptyStateButton: {
    minWidth: 160,
  },
});
