import { API_URL } from '../lib/api';

export interface TrainingChapter {
  id: number;
  chapter_title: string;
  modules: TrainingModule[];
}

export interface TrainingModule {
  id: number;
  module_title: string;
  leadership_trait: string;
  scenarios: TrainingScenario[];
}

export interface TrainingScenario {
  id: number;
  description: string;
  user_prompt: string;
  assignedLeadershipStyle?: string;
}

export interface UserProgress {
  chapterId: number;
  moduleId: number;
  scenarioId: number;
  completed: boolean;
}

export interface TrainingAttempt {
  id: number;
  situationId: number;
  response: string;
  score: number;
  evaluation: EvaluationResult;
  createdAt: string;
}

export interface EvaluationResult {
  styleMatchScore: number;
  clarity: number;
  empathy: number;
  persuasiveness: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
  passed: boolean;
}

export interface NextSituation {
  completed: boolean;
  message?: string;
  nextSituation?: {
    id: number;
    description: string;
    userPrompt: string;
    module: {
      id: number;
      title: string;
    };
    chapter: {
      id: number;
      title: string;
    };
  };
}

/**
 * Get all training chapters
 */
export async function getTrainingChapters(): Promise<TrainingChapter[]> {
  const response = await fetch(`${API_URL}/api/training/chapters`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch training chapters: ${response.status}`);
  }

  return response.json();
}

/**
 * Get user's training progress
 */
export async function getTrainingProgress(): Promise<UserProgress[]> {
  const response = await fetch(`${API_URL}/api/training/progress`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch training progress: ${response.status}`);
  }

  return response.json();
}

/**
 * Get user's training attempts
 */
export async function getTrainingAttempts(situationId?: number): Promise<TrainingAttempt[]> {
  const url = situationId 
    ? `${API_URL}/api/training/attempts?situationId=${situationId}`
    : `${API_URL}/api/training/attempts`;
    
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch training attempts: ${response.status}`);
  }

  return response.json();
}

/**
 * Get module details
 */
export async function getModuleDetails(chapterId: number, moduleId: number): Promise<TrainingModule> {
  const response = await fetch(`${API_URL}/api/training/chapters/${chapterId}/modules/${moduleId}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch module details: ${response.status}`);
  }

  return response.json();
}

/**
 * Get situation details
 */
export async function getSituationDetails(chapterId: number, moduleId: number, situationId: number): Promise<TrainingScenario> {
  const response = await fetch(`${API_URL}/api/training/chapters/${chapterId}/modules/${moduleId}/situations/${situationId}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch situation details: ${response.status}`);
  }

  return response.json();
}

/**
 * Submit training response for AI evaluation
 */
export async function submitTrainingResponse(data: {
  situationId: number;
  response: string;
  leadershipStyle: string;
}): Promise<{ success: boolean; evaluation: EvaluationResult; attemptId: number }> {
  const response = await fetch(`${API_URL}/api/training/submit-with-ai-evaluation`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit training response: ${response.status}`);
  }

  return response.json();
}

/**
 * Get module statistics
 */
export async function getModuleStats(chapterId: number, moduleId: number) {
  const response = await fetch(`${API_URL}/api/training/module/${moduleId}/stats?chapterId=${chapterId}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch module stats: ${response.status}`);
  }

  return response.json();
}

/**
 * Get next situation recommendation
 */
export async function getNextSituation(): Promise<NextSituation> {
  const response = await fetch(`${API_URL}/api/training/next-situation-direct`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch next situation: ${response.status}`);
  }

  return response.json();
}