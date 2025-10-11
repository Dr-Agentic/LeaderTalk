import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppLayout } from '../../src/components/navigation/AppLayout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ThemedText } from '../../src/components/ThemedText';
import { useTheme } from '../../src/hooks/useTheme';
import { useNextSituation } from '../../src/hooks/useTraining';

export default function NextSituationScreen() {
  const theme = useTheme();
  const { data: nextSituationData, isLoading } = useNextSituation();

  const handleStartExercise = () => {
    if (nextSituationData?.nextSituation) {
      const { nextSituation } = nextSituationData;
      router.push(
        `/training/chapter/${nextSituation.chapter.id}/module/${nextSituation.module.id}/situation/${nextSituation.id}`
      );
    }
  };

  const handleBackToTraining = () => {
    router.push('/(tabs)/training');
  };

  if (isLoading) {
    return (
      <AppLayout pageTitle="Loading Exercise...">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Finding your next exercise...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  // All training completed
  if (nextSituationData?.completed) {
    return (
      <AppLayout pageTitle="Training Complete">
        <StatusBar style="light" />
        
        <View style={styles.container}>
          <GlassCard style={styles.card}>
            <View style={styles.cardContent}>
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Feather name="award" size={48} color="#8A2BE2" />
                </View>
              </View>

              {/* Title */}
              <ThemedText style={styles.title}>All Situations Completed!</ThemedText>
              <ThemedText style={styles.subtitle}>
                Congratulations! You've completed all available leadership training situations.
              </ThemedText>

              {/* Description */}
              <ThemedText style={styles.description}>
                You've mastered the current training content. Check back later for new training
                modules or review your previous responses to continue improving your leadership skills.
              </ThemedText>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  title="View Training Progress"
                  onPress={handleBackToTraining}
                  variant="cta"
                  style={styles.primaryButton}
                />
                <Button
                  title="Return to Dashboard"
                  onPress={() => router.push('/(tabs)/')}
                  variant="outline"
                  style={styles.secondaryButton}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </AppLayout>
    );
  }

  // Next situation available
  if (nextSituationData?.nextSituation) {
    const { nextSituation } = nextSituationData;
    
    return (
      <AppLayout pageTitle="Continue Your Training">
        <StatusBar style="light" />
        
        <View style={styles.container}>
          <GlassCard style={styles.card}>
            <View style={styles.cardContent}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Feather name="book-open" size={48} color="#8A2BE2" />
                </View>
              </View>

              {/* Title */}
              <ThemedText style={styles.title}>Continue Your Training</ThemedText>
              <ThemedText style={styles.subtitle}>
                We've found the next leadership situation for you to practice
              </ThemedText>

              {/* Exercise Info */}
              <View style={styles.exerciseInfo}>
                <View style={styles.breadcrumb}>
                  <ThemedText style={styles.breadcrumbText}>
                    {nextSituation.chapter.title}
                  </ThemedText>
                  <Feather name="chevron-right" size={16} color="rgba(255, 255, 255, 0.5)" />
                  <ThemedText style={styles.breadcrumbText}>
                    {nextSituation.module.title}
                  </ThemedText>
                </View>
                
                <ThemedText style={styles.exerciseDescription}>
                  {nextSituation.description}
                </ThemedText>
              </View>

              {/* What You'll Practice */}
              <View style={styles.practiceSection}>
                <ThemedText style={styles.practiceTitle}>What you'll practice:</ThemedText>
                <View style={styles.practiceList}>
                  <View style={styles.practiceItem}>
                    <Feather name="check-square" size={16} color="#8A2BE2" />
                    <ThemedText style={styles.practiceText}>
                      Responding with different leadership styles
                    </ThemedText>
                  </View>
                  <View style={styles.practiceItem}>
                    <Feather name="check-square" size={16} color="#8A2BE2" />
                    <ThemedText style={styles.practiceText}>
                      Adapting communication to the situation
                    </ThemedText>
                  </View>
                  <View style={styles.practiceItem}>
                    <Feather name="check-square" size={16} color="#8A2BE2" />
                    <ThemedText style={styles.practiceText}>
                      Receiving feedback on your approach
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Start Exercise"
                  onPress={handleStartExercise}
                  variant="cta"
                  style={styles.startButton}
                  icon={<Feather name="arrow-right" size={20} color={theme.colors.foreground} />}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </AppLayout>
    );
  }

  // Fallback - no data
  return (
    <AppLayout pageTitle="No Situations Found">
      <StatusBar style="light" />
      
      <View style={styles.container}>
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Feather name="alert-circle" size={48} color="#F59E0B" />
            </View>
            
            <ThemedText style={styles.title}>No Situations Found</ThemedText>
            <ThemedText style={styles.description}>
              Could not find the next training situation. Please try again later.
            </ThemedText>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Return to Training"
                onPress={handleBackToTraining}
                variant="cta"
                style={styles.primaryButton}
              />
            </View>
          </View>
        </GlassCard>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 32,
  },
  exerciseInfo: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    opacity: 0.7,
  },
  exerciseDescription: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  practiceSection: {
    width: '100%',
    marginBottom: 32,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  practiceList: {
    gap: 12,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  practiceText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  startButton: {
    width: '100%',
  },
});
