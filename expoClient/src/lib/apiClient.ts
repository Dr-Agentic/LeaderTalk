import { API_URL } from './api';

/**
 * Make an authenticated API request (overloaded function)
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<any>;
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<Response>;
export async function apiRequest(
  endpointOrMethod: string,
  endpointOrOptions?: string | RequestInit,
  data?: any,
  options: RequestInit = {}
): Promise<any> {
  let method: string;
  let endpoint: string;
  let requestOptions: RequestInit;
  let requestData: any;

  // Handle both function signatures
  if (typeof endpointOrOptions === 'string') {
    // Old signature: apiRequest(method, endpoint, data, options)
    method = endpointOrMethod;
    endpoint = endpointOrOptions;
    requestData = data;
    requestOptions = options;
  } else {
    // New signature: apiRequest(endpoint, options)
    method = 'GET';
    endpoint = endpointOrMethod;
    requestOptions = endpointOrOptions || {};
    requestData = requestOptions.body ? JSON.parse(requestOptions.body as string) : undefined;
    
    // Extract method from options if provided
    if (requestOptions.method) {
      method = requestOptions.method;
    }
  }

  const url = `${API_URL}${endpoint}`;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...requestOptions.headers,
    },
    credentials: 'include', // Important for cookies
    ...requestOptions,
  };

  // Add body for non-GET requests
  if (requestData && method !== 'GET') {
    config.body = JSON.stringify(requestData);
  }

  console.log(`API Request: ${endpoint} ${url}`, requestData ? { data: requestData } : {});

  try {
    const response = await fetch(url, config);
    
    console.log(`API Response: ${endpoint} ${url} - Status: ${response.status}`);
    
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

    // For the new signature, return parsed JSON
    if (typeof endpointOrOptions !== 'string') {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    }

    // For the old signature, return the response object
    return response;
  } catch (error) {
    console.error(`API Error: ${endpoint} ${url}`, error);
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
