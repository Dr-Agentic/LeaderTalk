import { API_URL } from '../lib/api';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  progress: number;
  chapters: number;
  exercises: number;
  estimatedDuration: number;
}

export interface TrainingChapter {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  scenarios: TrainingScenario[];
}

export interface TrainingScenario {
  id: string;
  description: string;
  userPrompt: string;
  styleResponses: {
    empathetic: string;
    inspirational: string;
    commanding: string;
  };
}

/**
 * Get all available training modules
 */
export async function getTrainingModules(): Promise<TrainingModule[]> {
  const response = await fetch(`${API_URL}/api/training/modules`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch training modules: ${response.status}`);
  }

  return response.json();
}

/**
 * Get chapters for a specific training module
 */
export async function getModuleChapters(moduleId: string): Promise<TrainingChapter[]> {
  const response = await fetch(`${API_URL}/api/training/modules/${moduleId}/chapters`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch module chapters: ${response.status}`);
  }

  return response.json();
}

/**
 * Update user progress for a training module
 */
export async function updateModuleProgress(moduleId: string, progress: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/training/modules/${moduleId}/progress`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ progress }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update module progress: ${response.status}`);
  }
}