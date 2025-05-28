// API client for communicating with the backend

// Replace with your actual API URL
const API_BASE_URL = 'https://your-api-url.com';

// Generic API request function
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const config: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    // Check if response is empty
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    
    // Parse JSON response
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Check if user session is valid
export async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.error('Session check failed:', error);
    return false;
  }
}

// Upload audio recording
export async function uploadRecording(
  recordingId: number,
  audioUri: string,
  detectSpeakers: boolean = true,
  createTranscript: boolean = true
): Promise<{ success: boolean; message?: string }> {
  try {
    const formData = new FormData();
    
    // Add the audio file
    formData.append('audio', {
      uri: audioUri,
      name: `recording_${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);
    
    // Add other parameters
    formData.append('recordingId', recordingId.toString());
    formData.append('detectSpeakers', detectSpeakers.toString());
    formData.append('createTranscript', createTranscript.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/recordings/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Recording upload failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error during upload' 
    };
  }
}
