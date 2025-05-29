import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import BottomNavigation from '../components/ui/BottomNavigation';

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
  const [activeTab, setActiveTab] = useState('progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecordings, setFilteredRecordings] = useState(mockRecordings);
  
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
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
        // Already on transcripts screen
        break;
      case 'profile':
        navigation.navigate('Settings');
        break;
    }
  };

  // Render recording item
  const renderRecordingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recordingCard}
      onPress={() => navigation.navigate('TranscriptView', { id: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.recordingTitle}>{item.title}</Text>
        <Text style={styles.recordingDate}>{formatDate(item.date)}</Text>
      </View>
      
      <View style={styles.recordingMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaIcon}>🕒</Text>
          <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>
      
      <View style={styles.sentimentContainer}>
        <View 
          style={[
            styles.sentimentBar, 
            styles.positiveBar, 
            { flex: item.positivePercentage }
          ]} 
        />
        <View 
          style={[
            styles.sentimentBar, 
            styles.negativeBar, 
            { flex: item.negativePercentage }
          ]} 
        />
        <View 
          style={[
            styles.sentimentBar, 
            styles.neutralBar, 
            { flex: item.neutralPercentage }
          ]} 
        />
      </View>
      
      <View style={styles.sentimentLabels}>
        <View style={styles.sentimentLabel}>
          <View style={[styles.sentimentDot, styles.positiveDot]} />
          <Text style={styles.sentimentText}>{item.positivePercentage}% Positive</Text>
        </View>
        
        <View style={styles.sentimentLabel}>
          <View style={[styles.sentimentDot, styles.negativeDot]} />
          <Text style={styles.sentimentText}>{item.negativePercentage}% Negative</Text>
        </View>
        
        <View style={styles.sentimentLabel}>
          <View style={[styles.sentimentDot, styles.neutralDot]} />
          <Text style={styles.sentimentText}>{item.neutralPercentage}% Neutral</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {searchQuery ? (
        <>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search query
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>🎙️</Text>
          <Text style={styles.emptyTitle}>No recordings yet</Text>
          <Text style={styles.emptyText}>
            Start by recording a conversation to get insights
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Recording')}
          >
            <Text style={styles.emptyButtonText}>Start Recording</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transcripts</Text>
        <View style={{ width: 50 }} />
      </Animated.View>

      {/* Search and New Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search recordings..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('Recording')}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Recordings List */}
      <FlatList
        data={filteredRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
    fontSize: 16,
  },
  newButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  newButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  listContainer: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  recordingCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  recordingDate: {
    fontSize: 14,
    color: colors.textMuted,
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
  metaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sentimentContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sentimentBar: {
    height: '100%',
  },
  positiveBar: {
    backgroundColor: colors.success,
  },
  negativeBar: {
    backgroundColor: colors.error,
  },
  neutralBar: {
    backgroundColor: colors.textMuted,
  },
  sentimentLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sentimentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  positiveDot: {
    backgroundColor: colors.success,
  },
  negativeDot: {
    backgroundColor: colors.error,
  },
  neutralDot: {
    backgroundColor: colors.textMuted,
  },
  sentimentText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
});
