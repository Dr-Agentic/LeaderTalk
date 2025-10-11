import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppLayout } from '../../../../../../../src/components/navigation/AppLayout';
import { GlassCard } from '../../../../../../../src/components/ui/GlassCard';
import { Button } from '../../../../../../../src/components/ui/Button';
import { ProgressBar } from '../../../../../../../src/components/ui/ProgressBar';
import { ThemedText } from '../../../../../../../src/components/ThemedText';
import { useTheme } from '../../../../../../../src/hooks/useTheme';
import { 
  useSituationDetails, 
  useTrainingAttempts, 
  useSubmitTrainingResponse 
} from '../../../../../../../src/hooks/useTraining';
import type { EvaluationResult } from '../../../../../../../src/services/trainingService';

type SubmissionPhase = 'input' | 'submitting' | 'complete';

const getLeadershipStyleInfo = (style: string) => {
  switch (style?.toLowerCase()) {
    case 'empathetic':
      return {
        icon: 'heart',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        label: 'Empathetic Style'
      };
    case 'inspirational':
      return {
        icon: 'zap',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        label: 'Inspirational Style'
      };
    case 'commanding':
      return {
        icon: 'shield',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        label: 'Commanding Style'
      };
    default:
      return {
        icon: 'target',
        color: '#8A2BE2',
        bgColor: 'rgba(138, 43, 226, 0.1)',
        label: 'Leadership Style'
      };
  }
};

export default function SituationTrainingScreen() {
  const theme = useTheme();
  const { chapterId, moduleId, situationId } = useLocalSearchParams<{
    chapterId: string;
    moduleId: string;
    situationId: string;
  }>();

  const chapterIdNum = parseInt(chapterId || '0');
  const moduleIdNum = parseInt(moduleId || '0');
  const situationIdNum = parseInt(situationId || '0');

  const [response, setResponse] = useState('');
  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>('input');
  const [progress, setProgress] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const { data: situation, isLoading: situationLoading } = useSituationDetails(
    chapterIdNum, 
    moduleIdNum, 
    situationIdNum
  );
  const { data: attempts } = useTrainingAttempts(situationIdNum);
  const submitMutation = useSubmitTrainingResponse();

  // Progress bar simulation during submission
  useEffect(() => {
    if (submissionPhase === 'submitting') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [submissionPhase]);

  const handleSubmit = () => {
    if (!response.trim()) {
      Alert.alert('Response Required', 'Please provide your response before submitting.');
      return;
    }

    if (!situation?.assignedLeadershipStyle) {
      Alert.alert('Error', 'Leadership style not assigned. Please refresh and try again.');
      return;
    }

    setSubmissionPhase('submitting');
    
    submitMutation.mutate({
      situationId: situationIdNum,
      response: response.trim(),
      leadershipStyle: situation.assignedLeadershipStyle,
    }, {
      onSuccess: (data) => {
        setProgress(100);
        setEvaluation(data.evaluation);
        setSubmissionPhase('complete');
      },
      onError: (error) => {
        console.error('Submission error:', error);
        setSubmissionPhase('input');
        setProgress(0);
        Alert.alert('Submission Failed', 'There was an error submitting your response. Please try again.');
      },
    });
  };

  const handleTryAgain = () => {
    setResponse('');
    setSubmissionPhase('input');
    setProgress(0);
    setEvaluation(null);
  };

  const handleBackPress = () => {
    router.back();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  if (situationLoading) {
    return (
      <AppLayout pageTitle="Loading Exercise...">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <ThemedText style={styles.loadingText}>Loading training exercise...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  if (!situation) {
    return (
      <AppLayout pageTitle="Exercise Not Found">
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <ThemedText style={styles.errorTitle}>Exercise Not Found</ThemedText>
          <ThemedText style={styles.errorText}>
            The requested training exercise could not be found.
          </ThemedText>
          <Button
            title="Back to Module"
            onPress={handleBackPress}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </AppLayout>
    );
  }

  const styleInfo = getLeadershipStyleInfo(situation.assignedLeadershipStyle || '');

  return (
    <AppLayout pageTitle="Leadership Exercise">
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButtonContainer}>
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Leadership Exercise</ThemedText>
        </View>

        {/* Input Phase */}
        {submissionPhase === 'input' && (
          <View style={styles.inputPhase}>
            {/* Situation Description */}
            <GlassCard style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Feather name="target" size={20} color="#8A2BE2" />
                  <ThemedText style={styles.cardTitle}>Scenario</ThemedText>
                </View>
                <ThemedText style={styles.scenarioDescription}>
                  {situation.description}
                </ThemedText>
                <View style={styles.taskContainer}>
                  <ThemedText style={styles.taskLabel}>Your Task:</ThemedText>
                  <ThemedText style={styles.taskText}>{situation.user_prompt}</ThemedText>
                </View>
              </View>
            </GlassCard>

            {/* Leadership Style */}
            <View style={[styles.styleContainer, { backgroundColor: styleInfo.bgColor }]}>
              <View style={styles.styleContent}>
                <Feather name={styleInfo.icon as any} size={20} color={styleInfo.color} />
                <ThemedText style={[styles.styleText, { color: styleInfo.color }]}>
                  For this situation, demonstrate {styleInfo.label}
                </ThemedText>
              </View>
            </View>

            {/* Response Input */}
            <GlassCard style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Feather name="message-square" size={20} color="#8A2BE2" />
                  <ThemedText style={styles.cardTitle}>Your Response</ThemedText>
                </View>
                <TextInput
                  style={styles.responseInput}
                  placeholder="Type your response here... Consider your leadership style and the situation requirements."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={response}
                  onChangeText={setResponse}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <View style={styles.inputFooter}>
                  <ThemedText style={styles.characterCount}>
                    {response.length} characters
                  </ThemedText>
                  <Button
                    title="Submit Response"
                    onPress={handleSubmit}
                    disabled={!response.trim() || submitMutation.isPending}
                    variant="cta"
                  />
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Submitting Phase */}
        {submissionPhase === 'submitting' && (
          <GlassCard style={styles.card}>
            <View style={styles.submittingContent}>
              <ActivityIndicator size="large" color="#8A2BE2" />
              <ThemedText style={styles.submittingTitle}>Analyzing Your Response</ThemedText>
              <ThemedText style={styles.submittingText}>
                Our AI is evaluating your leadership approach and providing personalized feedback...
              </ThemedText>
              <View style={styles.progressContainer}>
                <ProgressBar progress={progress / 100} style={styles.progressBar} height={8} />
                <ThemedText style={styles.progressText}>
                  {Math.round(progress)}% complete
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Results Phase */}
        {submissionPhase === 'complete' && evaluation && (
          <View style={styles.resultsPhase}>
            {/* Overall Results */}
            <GlassCard style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Feather name="award" size={20} color="#8A2BE2" />
                  <ThemedText style={styles.cardTitle}>Evaluation Results</ThemedText>
                </View>
                
                <View style={styles.scoresGrid}>
                  <View style={styles.scoreItem}>
                    <ThemedText style={[styles.scoreValue, { color: getScoreColor(evaluation.styleMatchScore) }]}>
                      {evaluation.styleMatchScore}%
                    </ThemedText>
                    <ThemedText style={styles.scoreLabel}>Style Match</ThemedText>
                  </View>
                  <View style={styles.scoreItem}>
                    <ThemedText style={[styles.scoreValue, { color: getScoreColor(evaluation.clarity) }]}>
                      {evaluation.clarity}%
                    </ThemedText>
                    <ThemedText style={styles.scoreLabel}>Clarity</ThemedText>
                  </View>
                  <View style={styles.scoreItem}>
                    <ThemedText style={[styles.scoreValue, { color: getScoreColor(evaluation.empathy) }]}>
                      {evaluation.empathy}%
                    </ThemedText>
                    <ThemedText style={styles.scoreLabel}>Empathy</ThemedText>
                  </View>
                  <View style={styles.scoreItem}>
                    <ThemedText style={[styles.scoreValue, { color: getScoreColor(evaluation.persuasiveness) }]}>
                      {evaluation.persuasiveness}%
                    </ThemedText>
                    <ThemedText style={styles.scoreLabel}>Persuasiveness</ThemedText>
                  </View>
                </View>

                <View style={styles.overallScore}>
                  <View style={[
                    styles.overallBadge, 
                    { backgroundColor: evaluation.passed ? '#10B981' : '#F59E0B' }
                  ]}>
                    <ThemedText style={styles.overallText}>
                      Overall Score: {evaluation.overallScore}%
                      {evaluation.passed ? ' - PASSED' : ' - NEEDS IMPROVEMENT'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Feedback */}
            <View style={styles.feedbackGrid}>
              {/* Strengths */}
              <GlassCard style={styles.feedbackCard}>
                <View style={styles.cardContent}>
                  <ThemedText style={[styles.feedbackTitle, { color: '#10B981' }]}>Strengths</ThemedText>
                  <View style={styles.feedbackList}>
                    {evaluation.strengths.map((strength, index) => (
                      <View key={index} style={styles.feedbackItem}>
                        <Feather name="check-circle" size={16} color="#10B981" />
                        <ThemedText style={styles.feedbackText}>{strength}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>

              {/* Areas for Improvement */}
              <GlassCard style={styles.feedbackCard}>
                <View style={styles.cardContent}>
                  <ThemedText style={[styles.feedbackTitle, { color: '#F59E0B' }]}>Areas for Improvement</ThemedText>
                  <View style={styles.feedbackList}>
                    {evaluation.weaknesses.map((weakness, index) => (
                      <View key={index} style={styles.feedbackItem}>
                        <Feather name="alert-circle" size={16} color="#F59E0B" />
                        <ThemedText style={styles.feedbackText}>{weakness}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Recommendations */}
            <GlassCard style={styles.card}>
              <View style={styles.cardContent}>
                <ThemedText style={styles.cardTitle}>Personalized Recommendations</ThemedText>
                <ThemedText style={styles.recommendationText}>
                  {evaluation.improvement}
                </ThemedText>
              </View>
            </GlassCard>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                title="Try Again"
                onPress={handleTryAgain}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Continue Training"
                onPress={handleBackPress}
                variant="cta"
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        {/* Previous Attempts */}
        {attempts && attempts.length > 0 && submissionPhase === 'input' && (
          <GlassCard style={styles.card}>
            <View style={styles.cardContent}>
              <ThemedText style={styles.cardTitle}>Previous Attempts</ThemedText>
              <View style={styles.attemptsList}>
                {attempts.slice(0, 3).map((attempt, index) => (
                  <View key={attempt.id} style={styles.attemptItem}>
                    <View style={styles.attemptInfo}>
                      <ThemedText style={styles.attemptTitle}>
                        Attempt #{attempts.length - index}
                      </ThemedText>
                      <ThemedText style={styles.attemptDate}>
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    {attempt.score && (
                      <View style={[
                        styles.attemptScore,
                        { backgroundColor: getScoreColor(attempt.score) }
                      ]}>
                        <ThemedText style={styles.attemptScoreText}>
                          {attempt.score}%
                        </ThemedText>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </GlassCard>
        )}
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
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonContainer: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputPhase: {
    gap: 20,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  scenarioDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.9,
  },
  taskContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  taskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
    marginBottom: 8,
  },
  taskText: {
    fontSize: 16,
    lineHeight: 22,
  },
  styleContainer: {
    borderRadius: 12,
    padding: 16,
  },
  styleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  styleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  responseInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 120,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  submittingContent: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  submittingTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  submittingText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
  },
  progressText: {
    fontSize: 14,
    opacity: 0.7,
  },
  resultsPhase: {
    gap: 20,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  scoreItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  overallScore: {
    alignItems: 'center',
  },
  overallBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  overallText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  feedbackGrid: {
    gap: 16,
  },
  feedbackCard: {
    marginBottom: 0,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  feedbackList: {
    gap: 12,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  attemptsList: {
    gap: 12,
  },
  attemptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  attemptInfo: {
    flex: 1,
  },
  attemptTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  attemptDate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  attemptScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  attemptScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
