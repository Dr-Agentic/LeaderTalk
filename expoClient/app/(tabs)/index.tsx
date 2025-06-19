import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import { useAuth } from '@/src/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Welcome{user ? `, ${user.firstName || 'User'}` : ''}!</ThemedText>
        </View>
        
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Your Communication Journey</ThemedText>
          <ThemedText style={styles.cardText}>
            Track your progress and see how your communication skills are improving over time.
          </ThemedText>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Recordings</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Exercises</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>0%</ThemedText>
              <ThemedText style={styles.statLabel}>Progress</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Quick Actions</ThemedText>
          <View style={styles.actionsContainer}>
            <ThemedView style={styles.actionButton}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.actionIcon}
              />
              <ThemedText style={styles.actionText}>Record</ThemedText>
            </ThemedView>
            <ThemedView style={styles.actionButton}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.actionIcon}
              />
              <ThemedText style={styles.actionText}>Train</ThemedText>
            </ThemedView>
            <ThemedView style={styles.actionButton}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.actionIcon}
              />
              <ThemedText style={styles.actionText}>Leaders</ThemedText>
            </ThemedView>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          <ThemedText style={styles.emptyText}>
            No recent activity to display. Start recording or training to see your progress here.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginVertical: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardText: {
    marginTop: 8,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(0, 112, 243, 0.1)',
  },
  actionIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.7,
  },
});
