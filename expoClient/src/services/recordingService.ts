import { API_URL } from '../lib/api';

export interface RecordingUploadResponse {
  id: string;
  title: string;
  recordedAt: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
  analysisResult?: any;
}

/**
 * Upload a recording file and get analysis
 */
export async function uploadRecording(
  uri: string, 
  title?: string
): Promise<RecordingUploadResponse> {
  const formData = new FormData();
  
  // Add the audio file
  formData.append('audio', {
    uri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);
  
  // Add title if provided
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all recordings for the authenticated user
 */
export async function getRecordings() {
  const response = await fetch(`${API_URL}/api/recordings`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recordings: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific recording by ID
 */
export async function getRecording(id: string) {
  const response = await fetch(`${API_URL}/api/recordings/${id}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recording: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a recording
 */
export async function deleteRecording(id: string) {
  const response = await fetch(`${API_URL}/api/recordings/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete recording: ${response.status}`);
  }

  return response.json();
}