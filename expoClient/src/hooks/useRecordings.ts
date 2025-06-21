import { useState, useEffect } from 'react';
import { API_URL } from '../lib/api';

interface Recording {
  id: string;
  title: string;
  recordedAt: string;
  duration: number;
  analysisResult?: {
    timeline: Array<{ time: number; confidence: number; clarity: number; engagement: number }>;
    positiveInstances: Array<{ timestamp: number; analysis: string }>;
    negativeInstances: Array<{ timestamp: number; analysis: string }>;
    passiveInstances: Array<{ timestamp: number; analysis: string }>;
    leadershipInsights: Array<{ leaderId: string; leaderName: string; advice: string }>;
    overview: { rating: string; score: number };
  };
}

export function useRecordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/recordings`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }

      const data = await response.json();
      setRecordings(data);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recordings');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadRecording = async (uri: string, title?: string) => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      
      if (title) {
        formData.append('title', title);
      }

      const response = await fetch(`${API_URL}/api/recordings/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload recording: ${response.status}`);
      }

      const newRecording = await response.json();
      setRecordings(prev => [newRecording, ...prev]);
      return newRecording;
    } catch (err) {
      console.error('Error uploading recording:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  return {
    recordings,
    isLoading,
    error,
    refresh: fetchRecordings,
    uploadRecording,
  };
}