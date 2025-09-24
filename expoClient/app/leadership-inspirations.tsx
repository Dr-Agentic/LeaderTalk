import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { theme } from '../src/styles/theme';

import { AppLayout } from '../src/components/navigation/AppLayout';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { ThemedText } from '../src/components/ThemedText';
import { apiRequest } from '../src/lib/apiService';

interface Leader {
  id: number;
  name: string;
  title: string;
  description: string;
  traits?: string[];
  biography?: string;
  photoUrl?: string;
  controversial?: boolean;
  generationMostAffected?: string;
  leadershipStyles?: string[];
  famousPhrases?: string[];
}

type ViewMode = 'detailed' | 'compact';

// Mock data for demonstration
const MOCK_LEADERS: Leader[] = [
  {
    id: 1,
    name: 'Steve Jobs',
    title: 'Co-founder and CEO of Apple Inc.',
    description: 'Visionary leader who revolutionized technology and design thinking. Known for his perfectionism and ability to inspire teams to create groundbreaking products.',
    photoUrl: 'https://example.com/steve-jobs.jpg',
    leadershipStyles: ['Visionary', 'Transformational', 'Demanding'],
    traits: ['Innovation', 'Perfectionism', 'Vision'],
    famousPhrases: ['Stay hungry, stay foolish', 'Think different'],
  },
  {
    id: 2,
    name: 'Brené Brown',
    title: 'Research Professor and Author',
    description: 'Leading researcher on vulnerability, courage, and empathy. Transforms how leaders approach authenticity and human connection in the workplace.',
    photoUrl: 'https://example.com/brene-brown.jpg',
    leadershipStyles: ['Authentic', 'Empathetic', 'Vulnerable'],
    traits: ['Vulnerability', 'Courage', 'Empathy'],
    famousPhrases: ['Vulnerability is not weakness', 'Courage is contagious'],
  },
  {
    id: 3,
    name: 'Simon Sinek',
    title: 'Author and Motivational Speaker',
    description: 'Best known for popularizing the concept of "Start With Why." Focuses on inspiring leadership and creating purpose-driven organizations.',
    photoUrl: 'https://example.com/simon-sinek.jpg',
    leadershipStyles: ['Inspirational', 'Purpose-driven', 'Servant'],
    traits: ['Purpose', 'Inspiration', 'Communication'],
    famousPhrases: ['Start with why', 'Leaders eat last'],
  },
  {
    id: 4,
    name: 'Oprah Winfrey',
    title: 'Media Executive and Philanthropist',
    description: 'Influential media leader known for her empathetic communication style and ability to connect with diverse audiences on a personal level.',
    photoUrl: 'https://example.com/oprah-winfrey.jpg',
    leadershipStyles: ['Empathetic', 'Inspirational', 'Authentic'],
    traits: ['Empathy', 'Communication', 'Authenticity'],
    famousPhrases: ['What I know for sure', 'Live your best life'],
  },
  {
    id: 5,
    name: 'Elon Musk',
    title: 'CEO of Tesla and SpaceX',
    description: 'Innovative entrepreneur pushing boundaries in technology and space exploration. Known for ambitious vision and direct communication style.',
    photoUrl: 'https://example.com/elon-musk.jpg',
    leadershipStyles: ['Visionary', 'Disruptive', 'Direct'],
    traits: ['Innovation', 'Ambition', 'Risk-taking'],
    famousPhrases: ['Make life multiplanetary', 'Failure is an option here'],
  },
  {
    id: 6,
    name: 'Michelle Obama',
    title: 'Former First Lady and Author',
    description: 'Powerful advocate for education, health, and social justice. Known for her authentic leadership style and ability to inspire through storytelling.',
    photoUrl: 'https://example.com/michelle-obama.jpg',
    leadershipStyles: ['Authentic', 'Inspirational', 'Advocacy'],
    traits: ['Authenticity', 'Advocacy', 'Grace'],
    famousPhrases: ['When they go low, we go high', 'Success is only meaningful if it comes with honor'],
  },
];

const MOCK_USER_SELECTIONS = [1, 2, 3]; // Steve Jobs, Brené Brown, Simon Sinek

export default function LeadershipInspirationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [selectedSlots, setSelectedSlots] = useState<(number | null)[]>([null, null, null]);
  const [isSaving, setIsSaving] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch leaders data
  const { data: leaders, isLoading: isLoadingLeaders, refetch: refetchLeaders } = useQuery<Leader[]>({
    queryKey: ['/api/leaders'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return MOCK_LEADERS;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch user data to get current selections
  const { data: userData, refetch: refetchUserData } = useQuery({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { selectedLeaders: MOCK_USER_SELECTIONS };
    },
    refetchOnWindowFocus: false,
  });

  // Initialize slots from user data when it loads
  useEffect(() => {
    if (userData?.selectedLeaders && Array.isArray(userData.selectedLeaders)) {
      const slots = [null, null, null] as (number | null)[];
      
      userData.selectedLeaders.forEach((id: number, index: number) => {
        if (index < 3) {
          slots[index] = id;
        }
      });
      
      setSelectedSlots(slots);
    }
  }, [userData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLeaders(), refetchUserData()]);
    setRefreshing(false);
  };

  // Toggle a leader selection
  const toggleLeader = (leaderId: number) => {
    const existingIndex = selectedSlots.indexOf(leaderId);
    
    if (existingIndex !== -1) {
      // Leader is already selected - remove it
      const newSlots = [...selectedSlots];
      newSlots[existingIndex] = null;
      setSelectedSlots(newSlots);
    } else {
      // Leader is not selected - try to add it
      const firstEmptyIndex = selectedSlots.findIndex(slot => slot === null);
      
      if (firstEmptyIndex !== -1) {
        // Empty slot found - add the leader
        const newSlots = [...selectedSlots];
        newSlots[firstEmptyIndex] = leaderId;
        setSelectedSlots(newSlots);
      } else {
        // No empty slots - show error
        Alert.alert(
          'Maximum leaders reached',
          'You can only select up to 3 leaders. Please remove a leader before adding a new one.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Save selections to the database
  const saveSelections = async () => {
    const selectedLeaderIds = selectedSlots.filter((id): id is number => id !== null);
    
    if (selectedLeaderIds.length === 0) {
      Alert.alert(
        'No leaders selected',
        'Please select at least one leader who inspires you.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Leaders saved',
        'Your leadership inspirations have been saved successfully.',
        [{ text: 'OK' }]
      );
      
      // Refresh data
      await queryClient.invalidateQueries({
        queryKey: ['/api/users/me']
      });
      
    } catch (error) {
      console.error('Error saving leaders:', error);
      Alert.alert(
        'Error',
        'Failed to save leaders. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderLeaderSlot = (index: number) => {
    const leaderId = selectedSlots[index];
    const selectedLeader = leaderId !== null && Array.isArray(leaders) ? 
      leaders.find(leader => leader.id === leaderId) : null;
    const hasLeader = !!selectedLeader;

    return (
      <View key={index} style={[styles.leaderSlot, hasLeader && styles.leaderSlotSelected]}>
        {hasLeader ? (
          <>
            <View style={styles.leaderSlotImageContainer}>
              {selectedLeader.photoUrl ? (
                <Image
                  source={{ uri: selectedLeader.photoUrl }}
                  style={styles.leaderSlotImage}
                  onError={() => console.log('Failed to load image')}
                />
              ) : (
                <View style={styles.leaderSlotPlaceholder}>
                  <ThemedText style={styles.leaderSlotInitials}>
                    {selectedLeader.name.split(' ').map(n => n[0]).join('')}
                  </ThemedText>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => toggleLeader(selectedLeader.id)}
              >
                <Feather name="x" size={12} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.leaderSlotName} numberOfLines={2}>
              {selectedLeader.name}
            </ThemedText>
          </>
        ) : (
          <>
            <View style={styles.emptySlotContainer}>
              <Feather name="user" size={24} color="rgba(255, 255, 255, 0.3)" />
            </View>
            <ThemedText style={styles.emptySlotText}>Empty Slot</ThemedText>
          </>
        )}
      </View>
    );
  };

  const renderDetailedLeader = (leader: Leader) => {
    const isSelected = selectedSlots.includes(leader.id);

    return (
      <TouchableOpacity
        key={leader.id}
        style={[styles.leaderCard, isSelected && styles.leaderCardSelected]}
        onPress={() => toggleLeader(leader.id)}
      >
        {isSelected && (
          <View style={styles.selectedBadge}>
            <ThemedText style={styles.selectedBadgeText}>Selected</ThemedText>
          </View>
        )}

        <View style={styles.leaderImageContainer}>
          {leader.photoUrl ? (
            <Image
              source={{ uri: leader.photoUrl }}
              style={styles.leaderImage}
              onError={() => console.log('Failed to load image')}
            />
          ) : (
            <View style={styles.leaderImagePlaceholder}>
              <ThemedText style={styles.noImageText}>No image</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.leaderInfo}>
          <ThemedText style={styles.leaderName}>{leader.name}</ThemedText>
          <ThemedText style={styles.leaderTitle} numberOfLines={2}>
            {leader.title}
          </ThemedText>
          
          <ThemedText style={styles.leaderDescription} numberOfLines={3}>
            {leader.description}
          </ThemedText>

          {leader.leadershipStyles && leader.leadershipStyles.length > 0 && (
            <View style={styles.tagsContainer}>
              {leader.leadershipStyles.map((style, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{style}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompactLeader = (leader: Leader) => {
    const isSelected = selectedSlots.includes(leader.id);

    return (
      <TouchableOpacity
        key={leader.id}
        style={[styles.compactLeaderItem, isSelected && styles.compactLeaderItemSelected]}
        onPress={() => toggleLeader(leader.id)}
      >
        <View style={styles.compactLeaderImage}>
          {leader.photoUrl ? (
            <Image
              source={{ uri: leader.photoUrl }}
              style={styles.compactImage}
              onError={() => console.log('Failed to load image')}
            />
          ) : (
            <View style={styles.compactImagePlaceholder}>
              <ThemedText style={styles.compactInitials}>
                {leader.name.split(' ').map(n => n[0]).join('')}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.compactLeaderInfo}>
          <View style={styles.compactLeaderHeader}>
            <ThemedText style={styles.compactLeaderName}>{leader.name}</ThemedText>
            {isSelected && (
              <ThemedText style={styles.compactSelectedText}>Selected</ThemedText>
            )}
          </View>
          
          <ThemedText style={styles.compactLeaderTitle} numberOfLines={1}>
            {leader.title}
          </ThemedText>

          {leader.leadershipStyles && leader.leadershipStyles.length > 0 && (
            <View style={styles.compactTagsContainer}>
              {leader.leadershipStyles.slice(0, 3).map((style, index) => (
                <View key={index} style={styles.compactTag}>
                  <ThemedText style={styles.compactTagText}>{style}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoadingLeaders) {
    return (
      <AppLayout
        showBackButton
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        pageTitle="Leadership Inspirations"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>Loading leadership inspirations...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      showBackButton
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="Leadership Inspirations"
    >
      <StatusBar style="light" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Current Selections Display */}
        <GlassCard style={styles.selectionsCard}>
          <View style={styles.cardContent}>
            <ThemedText style={styles.sectionTitle}>Your Current Inspirations</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              These are the leaders who currently inspire your communication style. You can select up to 3 leaders.
            </ThemedText>
            
            <View style={styles.slotsContainer}>
              {[0, 1, 2].map(renderLeaderSlot)}
            </View>
          </View>
        </GlassCard>

        {/* Leader Selection */}
        <GlassCard style={styles.leadersCard}>
          <View style={styles.cardContent}>
            <View style={styles.leadersHeader}>
              <ThemedText style={styles.sectionTitle}>Available Leaders</ThemedText>
              
              <View style={styles.viewModeToggle}>
                <TouchableOpacity
                  style={[styles.toggleButton, viewMode === 'detailed' && styles.toggleButtonActive]}
                  onPress={() => setViewMode('detailed')}
                >
                  <ThemedText style={[styles.toggleButtonText, viewMode === 'detailed' && styles.toggleButtonTextActive]}>
                    Detailed
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, viewMode === 'compact' && styles.toggleButtonActive]}
                  onPress={() => setViewMode('compact')}
                >
                  <ThemedText style={[styles.toggleButtonText, viewMode === 'compact' && styles.toggleButtonTextActive]}>
                    Compact
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            
            <ThemedText style={styles.sectionDescription}>
              Select from our curated list of leaders to inspire your communication style.
            </ThemedText>

            {viewMode === 'detailed' ? (
              <View style={styles.detailedGrid}>
                {leaders?.filter(leader => !leader.controversial).map(renderDetailedLeader)}
              </View>
            ) : (
              <View style={styles.compactList}>
                {leaders?.filter(leader => !leader.controversial).map(renderCompactLeader)}
              </View>
            )}

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <Button
                title={isSaving ? 'Saving...' : 'Save Changes'}
                onPress={saveSelections}
                disabled={isSaving || selectedSlots.every(slot => slot === null)}
                variant="cta"
                size="large"
                style={styles.saveButton}
              />
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  selectionsCard: {
    marginBottom: 24,
  },
  leadersCard: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    lineHeight: 20,
  },
  slotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  leaderSlot: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minHeight: 120,
  },
  leaderSlotSelected: {
    borderColor: '#8A2BE2',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  leaderSlotImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  leaderSlotImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  leaderSlotPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderSlotInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderSlotName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  emptySlotContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptySlotText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  leadersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  detailedGrid: {
    gap: 16,
  },
  leaderCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  leaderCardSelected: {
    borderColor: '#8A2BE2',
    borderWidth: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  leaderImageContainer: {
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  leaderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  leaderImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  noImageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  leaderInfo: {
    padding: 16,
  },
  leaderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  leaderTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  leaderDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  compactList: {
    gap: 8,
  },
  compactLeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  compactLeaderItemSelected: {
    borderColor: '#8A2BE2',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  compactLeaderImage: {
    marginRight: 12,
  },
  compactImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  compactImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInitials: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  compactLeaderInfo: {
    flex: 1,
  },
  compactLeaderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactLeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  compactSelectedText: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  compactLeaderTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  compactTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  compactTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactTagText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  saveButtonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  saveButton: {
    minWidth: 200,
  },
});
