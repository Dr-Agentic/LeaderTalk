import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  getTrainingChapters,
  getTrainingProgress,
  getTrainingAttempts,
  getModuleDetails,
  getSituationDetails,
  submitTrainingResponse,
  getModuleStats,
  getNextSituation,
  type TrainingChapter,
  type UserProgress,
  type TrainingAttempt,
  type TrainingModule,
  type TrainingScenario,
  type EvaluationResult,
  type NextSituation,
} from '../services/trainingService';

/**
 * Get all training chapters
 */
export function useTrainingChapters() {
  const { isAuthenticated } = useAuth();
  
  return useQuery<TrainingChapter[]>({
    queryKey: ['/api/training/chapters'],
    queryFn: getTrainingChapters,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get user's training progress
 */
export function useTrainingProgress() {
  const { isAuthenticated } = useAuth();
  
  return useQuery<UserProgress[]>({
    queryKey: ['/api/training/progress'],
    queryFn: getTrainingProgress,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get user's training attempts
 */
export function useTrainingAttempts(situationId?: number) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<TrainingAttempt[]>({
    queryKey: ['/api/training/attempts', situationId],
    queryFn: () => getTrainingAttempts(situationId),
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get module details
 */
export function useModuleDetails(chapterId: number, moduleId: number) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<TrainingModule>({
    queryKey: ['/api/training/chapters', chapterId, 'modules', moduleId],
    queryFn: () => getModuleDetails(chapterId, moduleId),
    enabled: isAuthenticated && !!chapterId && !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get situation details
 */
export function useSituationDetails(chapterId: number, moduleId: number, situationId: number) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<TrainingScenario>({
    queryKey: ['/api/training/chapters', chapterId, 'modules', moduleId, 'situations', situationId],
    queryFn: () => getSituationDetails(chapterId, moduleId, situationId),
    enabled: isAuthenticated && !!chapterId && !!moduleId && !!situationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get module statistics
 */
export function useModuleStats(chapterId: number, moduleId: number) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['/api/training/module', moduleId, 'stats', { chapterId }],
    queryFn: () => getModuleStats(chapterId, moduleId),
    enabled: isAuthenticated && !!chapterId && !!moduleId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get next situation recommendation
 */
export function useNextSituation() {
  const { isAuthenticated } = useAuth();
  
  return useQuery<NextSituation>({
    queryKey: ['/api/training/next-situation-direct'],
    queryFn: getNextSituation,
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Submit training response for AI evaluation
 */
export function useSubmitTrainingResponse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: submitTrainingResponse,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/training/attempts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/module', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/next-situation-direct'] });
    },
  });
}
