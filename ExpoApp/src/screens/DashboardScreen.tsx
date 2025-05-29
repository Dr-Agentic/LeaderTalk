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
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>LeaderTalk</Text>
        
        <TouchableOpacity 
          style={styles.profilePicContainer}
          onPress={() => navigation.navigate('Settings')}
        >
          <LinearGradient
            colors={colors.accentGradient}
            style={styles.profilePic}
          >
            <Text style={styles.profileText}>JD</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={colors.heroGradient}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>Elevate Your{'\n'}Leadership</Text>
          <Text style={styles.heroSubtitle}>
            Connect with industry leaders and unlock your potential through meaningful conversations
          </Text>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <TouchableOpacity 
              style={styles.ctaButtonTouchable}
              onPress={() => navigation.navigate('Recording')}
            >
              <Text style={styles.ctaText}>Start Your Journey</Text>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>

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
          />

          <FeatureCard
            icon="📚"
            title="View Transcripts"
            description="Review your past conversations and track your communication progress"
            onPress={() => navigation.navigate('Transcripts')}
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
    colors={colors.statsGradient}
    style={styles.statCard}
  >
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

// FeatureCard Component with gradient icon background
const FeatureCard = ({ icon, title, description, onPress }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.cardHeader}>
      <LinearGradient
        colors={colors.accentGradient}
        style={styles.cardIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </LinearGradient>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardDescription}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: '10%',
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    bottom: '20%',
    left: -10,
  },
  circle3: {
    width: 80,
    height: 80,
    top: '60%',
    right: -30,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  logoGradient: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  profilePicContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: colors.text,
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
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.heroBorder,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  ctaButtonTouchable: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  ctaText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.statsBorder,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 120, // Extra padding at the bottom to ensure content is scrollable past the navigation bar
  },
});
