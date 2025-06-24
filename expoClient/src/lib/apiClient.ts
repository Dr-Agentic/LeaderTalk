import { API_URL } from './api';

/**
 * Make an authenticated API request
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for cookies
    ...options,
  };

  // Add body for non-GET requests
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  console.log(`API Request: ${method} ${url}`, data ? { data } : {});

  try {
    const response = await fetch(url, config);
    
    console.log(`API Response: ${method} ${url} - Status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    console.error(`API Error: ${method} ${url}`, error);
    throw error;
  }
}

/**
 * Upload a file with form data
 */
export async function uploadFile(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important for cookies
    ...options,
    // Don't set Content-Type header for FormData - let the browser set it with boundary
    headers: {
      ...options.headers,
    },
  };

  console.log(`File Upload: POST ${url}`);

  try {
    const response = await fetch(url, config);
    
    console.log(`Upload Response: POST ${url} - Status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    console.error(`Upload Error: POST ${url}`, error);
    throw error;
  }
}
