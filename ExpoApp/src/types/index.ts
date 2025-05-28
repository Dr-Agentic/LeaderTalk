// User types
export interface User {
  id: number;
  email: string;
  name: string;
  dateOfBirth?: string;
  profession?: string;
  goals?: string;
  selectedLeaders?: number[];
  createdAt: string;
  updatedAt: string;
}

// Leader types
export interface Leader {
  id: number;
  name: string;
  description: string;
  isControversial: boolean;
  imageUrl?: string;
}

// Recording types
export interface Recording {
  id: number;
  userId: number;
  title: string;
  date: string;
  duration: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingSegment {
  id: number;
  recordingId: number;
  start: number;
  end: number;
  text: string;
  speaker: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface RecordingAnalysis {
  strengths: string[];
  weaknesses: string[];
  leaderAlternatives: LeaderAlternative[];
}

export interface LeaderAlternative {
  leaderId: number;
  leaderName: string;
  originalText: string;
  alternativeText: string;
  segmentId: number;
}

// Training types
export interface Chapter {
  id: number;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: number;
  chapterId: number;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Situation {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  context: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SituationAttempt {
  id: number;
  userId: number;
  situationId: number;
  response: string;
  feedback: string;
  score: number;
  createdAt: string;
}

// Word usage types
export interface WordUsage {
  userId: number;
  currentPeriodWords: number;
  maxWords: number;
  periodStartDate: string;
  periodEndDate: string;
  daysRemaining: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
