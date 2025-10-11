import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppLayout } from '../../../../../src/components/navigation/AppLayout';
import { GlassCard } from '../../../../../src/components/ui/GlassCard';
import { Button } from '../../../../../src/components/ui/Button';
import { ProgressBar } from '../../../../../src/components/ui/ProgressBar';
import { ThemedText } from '../../../../../src/components/ThemedText';
import { useTheme } from '../../../../../src/hooks/useTheme';
import { useModuleDetails, useModuleStats } from '../../../../../src/hooks/useTraining';

export default function ModuleDetailScreen() {
  const theme = useTheme();
  const { chapterId, moduleId } = useLocalSearchParams<{
    chapterId: string;
    moduleId: string;
  }>();

  const chapterIdNum = parseInt(chapterId || '0');
  const moduleIdNum = parseInt(moduleId || '0');

  const { data: module, isLoading: moduleLoading } = useModuleDetails(chapterIdNum, moduleIdNum);
  const { data: moduleStats, isLoading: statsLoading } = useModuleStats(chapterIdNum, moduleIdNum);

  const handleSituationPress = (situationId: number) => {
    router.push(`/training/chapter/${chapterId}/module/${moduleId}/situation/${situationId}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  if (moduleLoading || statsLoading) {
    return (
      <AppLayout pageTitle="Loading Module...">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading module details...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  if (!module) {
    return (
      <AppLayout pageTitle="Module Not Found">
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <ThemedText style={styles.errorTitle}>Module Not Found</ThemedText>
          <ThemedText style={styles.errorText}>
            The requested training module could not be found.
          </ThemedText>
          <Button
            title="Back to Training"
            onPress={handleBackPress}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </AppLayout>
    );
  }

  const getSituationProgress = (situationId: number) => {
    if (!moduleStats?.situationStats) return null;
    return moduleStats.situationStats.find(stat => stat.situationId === situationId) || {
      status: "not-started",
      score: null,
      completedAt: null
    };
  };

  const moduleCompletion = moduleStats?.completionPercentage || 0;

  return (
    <AppLayout pageTitle={module.module_title}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <ThemedText style={styles.moduleTitle}>{module.module_title}</ThemedText>
            <View style={styles.progressContainer}>
              <ThemedText style={styles.progressText}>
                {moduleCompletion}% Complete
              </ThemedText>
              <ProgressBar 
                progress={moduleCompletion / 100} 
                style={styles.progressBar}
                height={6}
              />
            </View>
          </View>
        </View>

        {/* Leadership Trait Badge */}
        {module.leadership_trait && (
          <View style={styles.traitContainer}>
            <View style={styles.traitBadge}>
              <ThemedText style={styles.traitText}>{module.leadership_trait}</ThemedText>
            </View>
          </View>
        )}

        {/* Scenarios */}
        <View style={styles.scenariosSection}>
          <ThemedText style={styles.sectionTitle}>Training Scenarios</ThemedText>
          
          <View style={styles.scenariosList}>
            {module.scenarios?.map((scenario, index) => {
              const scenarioProgress = getSituationProgress(scenario.id);
              
              return (
                <GlassCard key={scenario.id} style={styles.scenarioCard}>
                  <TouchableOpacity
                    onPress={() => handleSituationPress(scenario.id)}
                    style={styles.scenarioContent}
                  >
                    {/* Status Badge */}
                    {scenarioProgress?.status === "completed" && (
                      <View style={styles.statusBadge}>
                        <ThemedText style={styles.statusBadgeText}>Passed</ThemedText>
                      </View>
                    )}
                    {scenarioProgress?.status === "failed" && (
                      <View style={[styles.statusBadge, styles.statusBadgeFailed]}>
                        <ThemedText style={styles.statusBadgeText}>Needs Improvement</ThemedText>
                      </View>
                    )}

                    {/* Scenario Header */}
                    <View style={styles.scenarioHeader}>
                      <View style={styles.scenarioTitleRow}>
                        {scenarioProgress?.status === "completed" ? (
                          <Feather name="check-circle" size={20} color="#10B981" />
                        ) : scenarioProgress?.status === "failed" ? (
                          <Feather name="x-circle" size={20} color="#F59E0B" />
                        ) : (
                          <View style={styles.scenarioNumber}>
                            <ThemedText style={styles.scenarioNumberText}>
                              {index + 1}
                            </ThemedText>
                          </View>
                        )}
                        <ThemedText style={styles.scenarioTitle}>
                          Scenario {index + 1}
                        </ThemedText>
                      </View>
                      
                      {scenarioProgress?.status !== "not-started" && (
                        <ThemedText style={styles.scenarioScore}>
                          Score: {scenarioProgress?.score}/100
                        </ThemedText>
                      )}
                    </View>

                    {/* Scenario Description */}
                    <ThemedText style={styles.scenarioDescription} numberOfLines={3}>
                      {scenario.description}
                    </ThemedText>

                    {/* Action Button */}
                    <View style={styles.scenarioAction}>
                      <View style={styles.actionButton}>
                        <ThemedText style={styles.actionButtonText}>
                          {scenarioProgress?.status !== "not-started"
                            ? "Review Response" 
                            : "Start Exercise"}
                        </ThemedText>
                        <Feather name="arrow-right" size={16} color="#8A2BE2" />
                      </View>
                    </View>
                  </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  backButton: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  moduleTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.8,
  },
  progressBar: {
    width: '100%',
  },
  traitContainer: {
    marginBottom: 32,
  },
  traitBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  traitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  scenariosSection: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scenariosList: {
    gap: 16,
  },
  scenarioCard: {
    marginBottom: 0,
  },
  scenarioContent: {
    padding: 20,
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
  },
  statusBadgeFailed: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  scenarioHeader: {
    marginBottom: 12,
  },
  scenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  scenarioNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scenarioScore: {
    fontSize: 14,
    opacity: 0.8,
  },
  scenarioDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.9,
  },
  scenarioAction: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
});
