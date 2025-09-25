import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../ui/GlassCard';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../hooks/useTheme';

interface QuickActionsProps {
  recordingsCount: number;
  weeklyImprovement: number;
}

export default function QuickActions({ recordingsCount, weeklyImprovement }: QuickActionsProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {/* Record New Conversation */}
      <GlassCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#8A2BE2', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Feather name="mic" size={20} color={theme.colors.foreground} />
            </LinearGradient>
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardLabel}>Record Conversation</ThemedText>
              <ThemedText style={styles.cardTitle}>Start a new recording</ThemedText>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/recording')}
            >
              <ThemedText style={styles.linkText}>Start recording</ThemedText>
              <ThemedText style={styles.arrowIcon}>→</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      {/* Recent Analyses */}
      <GlassCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Feather name="bar-chart-2" size={20} color={theme.colors.foreground} />
            </LinearGradient>
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardLabel}>Recent Analyses</ThemedText>
              <ThemedText style={styles.cardTitle}>
                {recordingsCount} {recordingsCount === 1 ? 'recording' : 'recordings'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/transcripts')}
            >
              <ThemedText style={styles.linkText}>View all analyses</ThemedText>
              <ThemedText style={styles.arrowIcon}>→</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      {/* Weekly Improvement */}
      <GlassCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Feather name="trending-up" size={20} color={theme.colors.foreground} />
            </LinearGradient>
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardLabel}>Weekly Improvement</ThemedText>
              <View style={styles.improvementContainer}>
                <ThemedText style={styles.cardTitle}>
                  {weeklyImprovement > 0 ? `+${weeklyImprovement}%` : `${weeklyImprovement}%`}
                </ThemedText>
                {weeklyImprovement > 0 && (
                  <View style={styles.improvementIndicator}>
                    <Feather name="arrow-up" size={16} color="#4ADE80" />
                    <ThemedText style={styles.improvementText}>vs last week</ThemedText>
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
              <ThemedText style={styles.linkText}>View progress</ThemedText>
              <ThemedText style={styles.arrowIcon}>→</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      {/* Training Module */}
      <GlassCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Feather name="award" size={20} color={theme.colors.foreground} />
            </LinearGradient>
            <View style={styles.textContainer}>
              <ThemedText style={styles.cardLabel}>Training Module</ThemedText>
              <ThemedText style={styles.cardTitle}>Improve your skills</ThemedText>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/training')}
            >
              <ThemedText style={styles.linkText}>Start training</ThemedText>
              <ThemedText style={styles.arrowIcon}>→</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 24,
  },
  cardHeader: {
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
    marginLeft: 20,
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
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  arrowIcon: {
    marginLeft: 4,
    fontSize: 14,
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
