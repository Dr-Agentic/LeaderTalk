import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

interface QuickActionsProps {
  recordingsCount: number;
  weeklyImprovement: number;
}

export default function QuickActions({ recordingsCount, weeklyImprovement }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      {/* Record New Conversation */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <LinearGradient
            colors={['#8A2BE2', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name="mic" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.textContainer}>
            <Text style={styles.cardLabel}>Record Conversation</Text>
            <Text style={styles.cardTitle}>Start a new recording</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/recording')}
          >
            <Text style={styles.linkText}>Start recording</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Analyses */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <LinearGradient
            colors={['#FF6B6B', '#4ECDC4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name="bar-chart-2" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.textContainer}>
            <Text style={styles.cardLabel}>Recent Analyses</Text>
            <Text style={styles.cardTitle}>
              {recordingsCount} {recordingsCount === 1 ? 'recording' : 'recordings'}
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/transcripts')}
          >
            <Text style={styles.linkText}>View all analyses</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Improvement */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name="trending-up" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.textContainer}>
            <Text style={styles.cardLabel}>Weekly Improvement</Text>
            <View style={styles.improvementContainer}>
              <Text style={styles.cardTitle}>
                {weeklyImprovement > 0 ? `+${weeklyImprovement}%` : `${weeklyImprovement}%`}
              </Text>
              {weeklyImprovement > 0 && (
                <View style={styles.improvementIndicator}>
                  <Feather name="arrow-up" size={16} color="#4ADE80" />
                  <Text style={styles.improvementText}>vs last week</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/progress')}
          >
            <Text style={styles.linkText}>View progress</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Training Module */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name="award" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.textContainer}>
            <Text style={styles.cardLabel}>Training Module</Text>
            <Text style={styles.cardTitle}>Improve your skills</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/training')}
          >
            <Text style={styles.linkText}>Start training</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  arrowIcon: {
    marginLeft: 4,
    fontSize: 14,
    color: '#fff',
  },
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  improvementText: {
    fontSize: 12,
    color: '#4ADE80',
    marginLeft: 4,
  },
});
