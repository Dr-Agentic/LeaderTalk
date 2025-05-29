import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle 
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import GradientCard from '../components/ui/GradientCard';
import FeatureCard from '../components/ui/FeatureCard';
import StatCard from '../components/ui/StatCard';
import BottomNavigation from '../components/ui/BottomNavigation';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('home');
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

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.logo}>LeaderTalk</Text>
        <TouchableOpacity 
          style={styles.profilePic}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.profileText}>JD</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent} 
        onScroll={onScroll} 
        scrollEventThrottle={16}
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
            iconBackgroundColor={colors.accent2}
          />

          <FeatureCard
            icon="📚"
            title="View Transcripts"
            description="Review your past conversations and track your communication progress"
            onPress={() => navigation.navigate('Transcripts')}
            iconBackgroundColor={colors.accent2}
          />
        </View>

        {/* Add some space at the bottom for the navigation bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

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
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  heroSection: {
    margin: 24,
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
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignSelf: 'flex-start',
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
  },
});
