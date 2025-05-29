// API client for communicating with the backend
import { logInfo, logError, logDebug, logWarn } from './debugLogger';

// API base URL - replace with your actual API URL
// For development, you might want to use your local server
// For production, use your deployed API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.leadertalk.com';

// Session state to track auth state
let sessionChecked = false;
let currentSessionId = '';
let currentUserId: number | null = null;

// Check if user session is valid
export async function checkSession(): Promise<boolean> {
  try {
    const timestamp = Date.now(); // Add timestamp to prevent caching
    logDebug("Checking session", { timestamp });
    
    const response = await fetch(`${API_BASE_URL}/api/debug/session?t=${timestamp}`, {
      credentials: 'include', // Ensure cookies are sent
      cache: 'no-cache',      // Prevent caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      const errorMsg = `Session check failed: ${response.status} ${response.statusText}`;
      console.error(errorMsg);
      logError(errorMsg);
      sessionChecked = true;
      return false;
    }
    
    const data = await response.json();
    logDebug("Received session data", data);
    
    // Update our tracking variables
    sessionChecked = true;
    
    // Track if session ID changes, which would indicate a new login
    const previousSessionId = currentSessionId;
    currentSessionId = data.sessionId || '';
    
    if (previousSessionId && currentSessionId && previousSessionId !== currentSessionId) {
      const msg = "Session ID changed - user likely logged out and back in";
      console.log(msg);
      logInfo(msg, { 
        previous: previousSessionId, 
        current: currentSessionId 
      });
    }
    
    currentUserId = data.userId || null;
    
    // Enhanced session status logging
    if (data.sessionExists && data.isLoggedIn) {
      const msg = `Session confirmed valid, user ID: ${currentUserId || 'unknown'}`;
      console.log(msg);
      logInfo(msg, { 
        userId: currentUserId,
        sessionId: data.sessionId,
        cookiePresent: data.cookiePresent,
        cookieExists: data.cookieExists
      });
      return true;
    } else {
      const msg = "No valid session found";
      console.log(msg);
      logWarn(msg, {
        sessionExists: data.sessionExists,
        cookiePresent: data.cookiePresent,
        cookieExists: data.cookieExists
      });
      return false;
    }
  } catch (error: any) {
    console.error("Auth check error:", error);
    logError("Auth check error", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace available"
    });
    return false;
  }
}

// Generic API request function
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  try {
    logDebug("API request", { method, endpoint, hasData: !!data });
    
    // For authenticated API routes, check session first
    if (endpoint.includes('/api/') && !endpoint.includes('/api/auth/') && method !== 'GET') {
      try {
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
          const msg = "Session check prior to API call shows not logged in";
          console.log(msg);
          logWarn(msg, { method, endpoint });
          throw new Error("Unauthorized - Session invalid");
        }
      } catch (sessionError: any) {
        console.error("Session check error:", sessionError);
        logError("Session check error before API call", {
          message: sessionError?.message || "Unknown error",
          endpoint,
          method
        });
        // Continue with request, server will handle auth validation
      }
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add timestamp to URL to prevent caching
    const timestampedUrl = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options?.headers,
    };
    
    const config: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies for authentication
      ...options,
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    // Perform the fetch with retries for network issues
    let retries = 0;
    const MAX_RETRIES = 2;
    let response: Response;
    
    while (true) {
      try {
        response = await fetch(timestampedUrl, config);
        break; // Success, exit retry loop
      } catch (networkError: any) {
        retries++;
        if (retries > MAX_RETRIES) {
          logError("Network request failed after retries", {
            url: timestampedUrl,
            retries,
            error: networkError?.message || "Unknown network error"
          });
          throw networkError; // Re-throw after max retries
        }
        
        logWarn("Network request failed, retrying...", {
          url: timestampedUrl,
          retry: retries,
          error: networkError?.message
        });
        
        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retries)));
      }
    }
    
    // Special case for unauthorized - check session again
    if (response.status === 401 && endpoint.includes('/api/') && !endpoint.includes('/api/auth/')) {
      const msg = "Unauthorized response, checking session again...";
      console.log(msg);
      logWarn(msg, { endpoint, method, status: response.status });
      
      // Double-check session status
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        const redirectMsg = "Confirmed session is invalid";
        console.log(redirectMsg);
        logWarn(redirectMsg, { endpoint, method });
        throw new Error("Unauthorized - Session invalid");
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `API Error: ${response.status} - ${errorText}`;
      logError("API request failed", {
        status: response.status,
        endpoint,
        method,
        errorText
      });
      throw new Error(errorMsg);
    }
    
    // Check if response is empty
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    
    // Parse JSON response
    logDebug("API request successful", { endpoint, method, status: response.status });
    return JSON.parse(text) as T;
  } catch (error: any) {
    console.error('API request failed:', error);
    logError("API request failed", {
      endpoint,
      method,
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace available"
    });
    throw error;
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
    logDebug("Uploading recording", { recordingId, audioUri, detectSpeakers, createTranscript });
    
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
      const errorMsg = `Upload failed: ${response.status} - ${errorText}`;
      logError("Recording upload failed", {
        status: response.status,
        errorText,
        recordingId
      });
      throw new Error(errorMsg);
    }
    
    logInfo("Recording uploaded successfully", { recordingId });
    return { success: true };
  } catch (error: any) {
    console.error('Recording upload failed:', error);
    logError("Recording upload failed", {
      recordingId,
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace available"
    });
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error during upload' 
    };
  }
}
