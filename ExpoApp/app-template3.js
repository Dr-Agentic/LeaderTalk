import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LeaderTalkApp() {
  const scrollY = useSharedValue(0);
  const [activeTab, setActiveTab] = useState('home');

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={["#0a0a0a", "#1a0033", "#0a0a0a"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.logo}>LeaderTalk</Text>
        <TouchableOpacity style={styles.profilePic}>
          <Text style={styles.profileText}>JD</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent} 
        onScroll={onScroll} 
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>

        <LinearGradient colors={["rgba(138,43,226,0.1)", "rgba(255,107,107,0.1)"]} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Elevate Your{'\n'}Leadership</Text>
          <Text style={styles.heroSubtitle}>Connect with industry leaders and unlock your potential through meaningful conversations</Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaText}>Start Your Journey</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { number: '47K', label: 'LEADERS' },
            { number: '180K', label: 'SESSIONS' },
            { number: '95%', label: 'SUCCESS' }
          ].map((stat, i) => (
            <LinearGradient
              key={i}
              colors={["rgba(138,43,226,0.1)", "rgba(255,107,107,0.1)"]}
              style={styles.statCard}
            >
              <Text style={styles.statNumber}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Featured Sessions */}
        <Text style={styles.sectionTitle}>Featured Sessions</Text>
        <View style={styles.cardsContainer}>
          {[
            { icon: '🚀', title: 'Innovation Leadership', desc: 'Master the art of leading through change and driving innovation in your organization' },
            { icon: '🎯', title: 'Strategic Thinking', desc: 'Develop strategic mindset and learn to make decisions that shape the future' },
            { icon: '💡', title: 'Team Dynamics', desc: 'Build high-performing teams and create cultures of excellence and collaboration' },
          ].map((card, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Text style={styles.iconText}>{card.icon}</Text>
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{card.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.cardsContainer}>
          {[
            { icon: '📞', title: 'Schedule 1:1', desc: 'Book a personal session with top executives and industry leaders' },
            { icon: '📚', title: 'Learning Path', desc: 'Follow curated learning journeys designed by leadership experts' },
          ].map((card, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.iconText}>{card.icon}</Text>
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{card.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add some space at the bottom for the navigation bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { icon: '🏠', label: 'Home', tab: 'home' },
          { icon: '🔍', label: 'Explore', tab: 'explore' },
          { icon: '💬', label: 'Sessions', tab: 'sessions' },
          { icon: '📊', label: 'Progress', tab: 'progress' },
          { icon: '👤', label: 'Profile', tab: 'profile' }
        ].map((item, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[styles.navItem, activeTab === item.tab && styles.activeNavItem]}
            onPress={() => setActiveTab(item.tab)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, activeTab === item.tab && styles.activeNavLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

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
    color: '#fff',
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
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  heroSection: {
    margin: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.2)',
  },
  heroTitle: {
    color: '#fff',
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
    color: '#fff',
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
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#fff',
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
    backgroundColor: '#FF6B6B',
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
    color: '#fff',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    paddingVertical: 12,
    paddingBottom: 34, // Extra padding for iPhone home indicator
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#8A2BE2',
  },
});
