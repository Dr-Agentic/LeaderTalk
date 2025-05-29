import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function App() {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <LinearGradient colors={["#0a0a0a", "#1a0033", "#0a0a0a"]} style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>●●●●● 100%</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.logo}>LeaderTalk</Text>
        <TouchableOpacity style={styles.profilePic}>
          <Text style={styles.profileText}>JD</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent} 
        onScroll={onScroll} 
        scrollEventThrottle={16}>

        <LinearGradient colors={["rgba(138,43,226,0.1)", "rgba(255,107,107,0.1)"]} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Elevate Your Leadership</Text>
          <Text style={styles.heroSubtitle}>Connect with industry leaders and unlock your potential through meaningful conversations</Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaText}>Start Your Journey</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {['47K', '180K', '95%'].map((stat, i) => (
            <LinearGradient
              key={i}
              colors={["rgba(138,43,226,0.1)", "rgba(255,107,107,0.1)"]}
              style={styles.statCard}
            >
              <Text style={styles.statNumber}>{stat}</Text>
              <Text style={styles.statLabel}>{['Leaders', 'Sessions', 'Success'][i]}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Featured Sessions */}
        <Text style={styles.sectionTitle}>Featured Sessions</Text>
        <View style={styles.cardsContainer}>
          {[
            { icon: 'rocket', title: 'Innovation Leadership', desc: 'Master the art of leading through change and driving innovation in your organization' },
            { icon: 'bullseye', title: 'Strategic Thinking', desc: 'Develop strategic mindset and learn to make decisions that shape the future' },
            { icon: 'bulb', title: 'Team Dynamics', desc: 'Build high-performing teams and create cultures of excellence and collaboration' },
          ].map((card, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}><Text>🚀</Text></View>
                <Text style={styles.cardTitle}>{card.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{card.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {["🏠", "🔍", "💬", "📊", "👤"].map((icon, idx) => (
          <TouchableOpacity key={idx} style={styles.navItem}>
            <Text style={styles.navIcon}>{icon}</Text>
            <Text style={styles.navLabel}>Tab</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    paddingTop: 40,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingBottom: 100,
  },
  heroSection: {
    margin: 24,
    borderRadius: 24,
    padding: 24,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  heroSubtitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  cardsContainer: {
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    color: '#8A2BE2',
  },
  navLabel: {
    fontSize: 11,
    color: '#ccc',
  },
});
