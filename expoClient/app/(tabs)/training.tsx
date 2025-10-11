import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppLayout } from '../../src/components/navigation/AppLayout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { ThemedText } from '../../src/components/ThemedText';
import { useTheme } from '../../src/hooks/useTheme';
import { 
  useTrainingChapters, 
  useTrainingProgress, 
  useNextSituation 
} from '../../src/hooks/useTraining';

export default function TrainingScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch training data using real APIs
  const { data: chapters, isLoading: chaptersLoading, refetch: refetchChapters } = useTrainingChapters();
  const { data: userProgress, refetch: refetchProgress } = useTrainingProgress();
  const { data: nextSituation } = useNextSituation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchChapters(), refetchProgress()]);
    setRefreshing(false);
  };

  // Calculate total progress
  const totalSituations = chapters?.reduce(
    (total, chapter) =>
      total +
      chapter.modules.reduce(
        (moduleTotal, module) => moduleTotal + module.scenarios.length,
        0
      ),
    0
  ) || 0;

  const completedSituations = userProgress?.length || 0;
  const progressPercentage = totalSituations > 0 ? (completedSituations / totalSituations) * 100 : 0;

  const handleStartNextExercise = () => {
    if (nextSituation && !nextSituation.completed) {
      router.push('/training/next-situation');
    }
  };

  const handleModulePress = (chapterId: number, moduleId: number) => {
    router.push(`/training/chapter/${chapterId}/module/${moduleId}`);
  };

  if (chaptersLoading) {
    return (
      <AppLayout pageTitle="Leadership Training">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading training content...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Leadership Training">
      <StatusBar style="light" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Progress Overview */}
        <GlassCard style={styles.progressCard}>
          <View style={styles.cardContent}>
            <View style={styles.progressHeader}>
              <Feather name="check-circle" size={20} color="#10B981" />
              <ThemedText style={styles.cardTitle}>Your Progress</ThemedText>
            </View>
            <ThemedText style={styles.cardDescription}>
              Track your advancement through the leadership training program
            </ThemedText>
            
            <View style={styles.progressStats}>
              <View style={styles.progressRow}>
                <ThemedText style={styles.progressLabel}>Completed Situations</ThemedText>
                <ThemedText style={styles.progressValue}>
                  {completedSituations} of {totalSituations}
                </ThemedText>
              </View>
              
              <ProgressBar 
                progress={progressPercentage / 100} 
                style={styles.progressBar}
                height={8}
              />
              
              <ThemedText style={styles.progressPercentage}>
                {Math.round(progressPercentage)}% Complete
              </ThemedText>
            </View>
          </View>
        </GlassCard>

        {/* Continue Training Button */}
        {nextSituation && !nextSituation.completed && (
          <GlassCard style={styles.continueCard}>
            <View style={styles.cardContent}>
              <ThemedText style={styles.continueTitle}>Continue Your Training</ThemedText>
              <ThemedText style={styles.cardDescription}>
                Ready for your next leadership challenge
              </ThemedText>
              
              <Button
                title="Start Next Exercise"
                onPress={handleStartNextExercise}
                variant="cta"
                size="large"
                style={styles.continueButton}
                icon={<Feather name="chevron-right" size={20} color={theme.colors.foreground} />}
              />
            </View>
          </GlassCard>
        )}

        {/* Training Chapters */}
        <View style={styles.chaptersSection}>
          <ThemedText style={styles.sectionTitle}>Training Chapters</ThemedText>
          
          <View style={styles.chaptersList}>
            {chapters?.map((chapter, index) => {
              const chapterProgress = chapter.modules.reduce((total, module) => {
                const moduleCompleted = userProgress?.filter(
                  (p) => p.chapterId === chapter.id && p.moduleId === module.id
                ).length || 0;
                return total + moduleCompleted;
              }, 0);

              const chapterTotal = chapter.modules.reduce(
                (total, module) => total + module.scenarios.length,
                0
              );

              const chapterPercentage = chapterTotal > 0 ? (chapterProgress / chapterTotal) * 100 : 0;

              return (
                <GlassCard key={chapter.id} style={styles.chapterCard}>
                  <View style={styles.cardContent}>
                    {/* Chapter Header */}
                    <View style={styles.chapterHeader}>
                      <View style={styles.chapterTitleContainer}>
                        <View style={styles.chapterTitleRow}>
                          <Feather name="book-open" size={20} color="#8A2BE2" />
                          <ThemedText style={styles.chapterTitle}>
                            {chapter.chapter_title}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.chapterMeta}>
                          {chapter.modules.length} modules • {chapterTotal} exercises
                        </ThemedText>
                      </View>
                      
                      <View style={styles.chapterProgress}>
                        <ThemedText style={styles.chapterProgressText}>
                          {chapterProgress} of {chapterTotal} completed
                        </ThemedText>
                        <ProgressBar 
                          progress={chapterPercentage / 100} 
                          style={styles.chapterProgressBar}
                          height={4}
                        />
                      </View>
                    </View>

                    {/* Modules */}
                    <View style={styles.modulesList}>
                      {chapter.modules.map((module) => {
                        const moduleCompleted = userProgress?.filter(
                          (p) => p.chapterId === chapter.id && p.moduleId === module.id
                        ).length || 0;

                        const moduleTotal = module.scenarios.length;
                        const isModuleComplete = moduleCompleted === moduleTotal;

                        return (
                          <TouchableOpacity
                            key={module.id}
                            style={styles.moduleItem}
                            onPress={() => handleModulePress(chapter.id, module.id)}
                            disabled={isModuleComplete}
                          >
                            <View style={styles.moduleContent}>
                              <View style={styles.moduleInfo}>
                                <ThemedText style={styles.moduleTitle}>
                                  {module.module_title}
                                </ThemedText>
                                <ThemedText style={styles.moduleMeta}>
                                  {module.leadership_trait} • {moduleTotal} exercises
                                </ThemedText>
                              </View>
                              
                              <View style={styles.moduleActions}>
                                <ThemedText style={styles.moduleProgress}>
                                  {moduleCompleted}/{moduleTotal}
                                </ThemedText>
                                
                                {isModuleComplete ? (
                                  <Feather name="check-circle" size={20} color="#10B981" />
                                ) : (
                                  <View style={styles.moduleButton}>
                                    <ThemedText style={styles.moduleButtonText}>
                                      {moduleCompleted > 0 ? 'Continue' : 'Start'}
                                    </ThemedText>
                                    <Feather name="chevron-right" size={16} color="#8A2BE2" />
                                  </View>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'transparent',
  },
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
    marginTop: 20,
    fontSize: 16,
  },
  progressCard: {
    marginBottom: 24,
  },
  cardContent: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  progressStats: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressBar: {
    marginVertical: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  continueCard: {
    marginBottom: 32,
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  continueButton: {
    width: '100%',
    marginTop: 8,
  },
  chaptersSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  chaptersList: {
    gap: 20,
  },
  chapterCard: {
    marginBottom: 0,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chapterTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  chapterMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chapterProgress: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  chapterProgressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  chapterProgressBar: {
    width: 80,
  },
  modulesList: {
    gap: 12,
  },
  moduleItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  moduleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleInfo: {
    flex: 1,
    marginRight: 16,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  moduleMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleProgress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  moduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
});
