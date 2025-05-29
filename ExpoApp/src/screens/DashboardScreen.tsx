import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import GradientCard from '../components/ui/GradientCard';
import BottomNavigation from '../components/ui/BottomNavigation';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('home');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigate to the appropriate screen based on the tab
    switch (tab) {
      case 'home':
        // Already on dashboard
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0a0a0a", "#1a0033", "#0a0a0a"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>LeaderTalk</Text>
        <TouchableOpacity 
          style={styles.profilePic}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.profileText}>JD</Text>
        </TouchableOpacity>
      </View>

      {/* Content - Changed from View to ScrollView to enable scrolling */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <GradientCard style={styles.heroSection}>
          <Text style={styles.heroTitle}>Elevate Your{'\n'}Leadership</Text>
          <Text style={styles.heroSubtitle}>
            Connect with industry leaders and unlock your potential through meaningful conversations
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Recording')}
          >
            <Text style={styles.ctaText}>Start Recording</Text>
          </TouchableOpacity>
        </GradientCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard number="47K" label="LEADERS" />
          <StatCard number="180K" label="SESSIONS" />
          <StatCard number="95%" label="SUCCESS" />
        </View>

        {/* Featured Sessions */}
        <Text style={styles.sectionTitle}>Featured Sessions</Text>
        <View style={styles.cardsContainer}>
          <FeatureCard
            icon="🚀"
            title="Innovation Leadership"
            description="Master the art of leading through change and driving innovation in your organization"
            onPress={() => navigation.navigate('Training')}
          />

          <FeatureCard
            icon="🎯"
            title="Strategic Thinking"
            description="Develop strategic mindset and learn to make decisions that shape the future"
            onPress={() => navigation.navigate('Training')}
          />

          <FeatureCard
            icon="💡"
            title="Team Dynamics"
            description="Build high-performing teams and create cultures of excellence and collaboration"
            onPress={() => navigation.navigate('Training')}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.cardsContainer}>
          <FeatureCard
            icon="📞"
            title="Record Conversation"
            description="Record a conversation to get AI-powered insights on your communication style"
            onPress={() => navigation.navigate('Recording')}
            accentColor="#4ECDC4"
          />

          <FeatureCard
            icon="📚"
            title="View Transcripts"
            description="Review your past conversations and track your communication progress"
            onPress={() => navigation.navigate('Transcripts')}
            accentColor="#4ECDC4"
          />
        </View>
        
        {/* Add padding at the bottom to ensure content is scrollable past the bottom navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
}

// StatCard Component
const StatCard = ({ number, label }) => (
  <LinearGradient
    colors={['rgba(138, 43, 226, 0.1)', 'rgba(255, 107, 107, 0.1)']}
    style={styles.statCard}
  >
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

// FeatureCard Component
const FeatureCard = ({ icon, title, description, onPress, accentColor = '#FF6B6B' }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.cardIcon, { backgroundColor: accentColor }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardDescription}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  heroSection: {
    margin: 24,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.2)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
  },
  cardsContainer: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 120, // Extra padding at the bottom to ensure content is scrollable past the navigation bar
  },
});
