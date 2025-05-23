import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logInfo, logError, logDebug, logWarn } from "./debugLogger";

// Session state to track auth state
let sessionChecked = false;
let currentSessionId = '';
let currentUserId: number | null = null;

export async function checkSession(): Promise<boolean> {
  try {
    const timestamp = Date.now(); // Add timestamp to prevent caching
    const response = await fetch(`/api/debug/session?t=${timestamp}`, {
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
    } else if (data.sessionExists && !data.isLoggedIn) {
      const msg = "Session exists but not logged in (likely expired)";
      console.log(msg);
      logWarn(msg, {
        sessionId: data.sessionId,
        cookiePresent: data.cookiePresent,
        cookieExists: data.cookieExists,
        cookieHeader: data.cookieHeader ? 'Present' : 'Missing'
      });
      
      // Try a direct call to force-login in development mode
      if (import.meta.env.DEV && window.location.hostname === 'localhost') {
        console.log("Attempting development mode direct login");
        try {
          const forcedLogin = await fetch('/api/auth/force-login', {
            credentials: 'include',
            cache: 'no-cache'
          });
          
          if (forcedLogin.ok) {
            console.log("Development mode login successful, revalidating session");
            // Wait a moment for the session to be properly set
            await new Promise(resolve => setTimeout(resolve, 500));
            return await checkSession(); // Retry the session check
          }
        } catch (e) {
          console.log("Development mode login failed, continuing with normal flow");
        }
      }
      
      return false;
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

async function throwIfResNotOk(res: Response) {
  // Consider 302 to be "ok" if it contains redirection information
  if (res.status === 302) {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.redirect && data.redirectUrl) {
        const msg = `Redirecting from API to: ${data.redirectUrl}`;
        console.log(msg);
        logInfo(msg, { url: data.redirectUrl });
        window.location.href = data.redirectUrl;
        return; // Stop processing, redirection will happen
      }
    } catch (e: any) {
      // Not JSON or doesn't have redirect info, treat as error
      logWarn("Received 302 but couldn't parse redirection info", {
        responseText: text,
        error: e?.message || "Unknown parse error"
      });
    }
  }
  
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const errorMsg = `${res.status}: ${text}`;
    logError("API request failed", {
      status: res.status,
      statusText: res.statusText,
      responseText: text,
      url: res.url
    });
    throw new Error(errorMsg);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    logDebug("API request", { method, url, hasData: !!data });
    
    // For authenticated API routes, check session first
    if (url.includes('/api/') && !url.includes('/api/auth/') && method !== 'GET') {
      try {
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
          const msg = "Session check prior to API call shows not logged in, redirecting...";
          console.log(msg);
          logWarn(msg, { method, url });
          window.location.href = '/login';
          throw new Error("Unauthorized - Session invalid");
        }
      } catch (sessionError: any) {
        console.error("Session check error:", sessionError);
        logError("Session check error before API call", {
          message: sessionError?.message || "Unknown error",
          url,
          method
        });
        // Continue with request, server will handle auth validation
      }
    }
    
    // Prepare fetch options with proper cache control
    const fetchOptions: RequestInit = {
      method,
      headers: {
        // Always include cache control headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    };
    
    // Add content type when there's data
    if (data) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json'
      };
    }
    
    // Add timestamp to URL to prevent caching
    const timestampedUrl = url.includes('?') 
      ? `${url}&_t=${Date.now()}` 
      : `${url}?_t=${Date.now()}`;
    
    // Perform the fetch with retries for network issues
    let retries = 0;
    const MAX_RETRIES = 2;
    let res: Response;
    
    while (true) {
      try {
        res = await fetch(timestampedUrl, fetchOptions);
        break; // Success, exit retry loop
      } catch (networkError: any) {
        retries++;
        if (retries > MAX_RETRIES) {
          logError("Network request failed after retries", {
            url,
            retries,
            error: networkError?.message || "Unknown network error"
          });
          throw networkError; // Re-throw after max retries
        }
        
        logWarn("Network request failed, retrying...", {
          url,
          retry: retries,
          error: networkError?.message
        });
        
        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retries)));
      }
    }
    
    // Special case for unauthorized - redirect to login page
    if (res.status === 401 && url.includes('/api/') && !url.includes('/api/auth/')) {
      const msg = "Unauthorized response, checking session again...";
      console.log(msg);
      logWarn(msg, { url, method, status: res.status });
      
      // Double-check session status
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        const redirectMsg = "Confirmed session is invalid, redirecting to login...";
        console.log(redirectMsg);
        logWarn(redirectMsg, { url, method });
        window.location.href = '/login';
        return res; // Skip throwing error
      } else {
        const mismatchMsg = "Session appears valid but got 401 - possible server-side auth mismatch";
        console.log(mismatchMsg);
        logError(mismatchMsg, { url, method });
        
        // In development, try to force a login to recover
        if (import.meta.env.DEV && window.location.hostname === 'localhost') {
          try {
            console.log("Attempting development recovery with force-login...");
            const forceLogin = await fetch('/api/auth/force-login', { 
              credentials: 'include' 
            });
            
            if (forceLogin.ok) {
              console.log("Development recovery successful, retrying request");
              // Wait a moment for session to update
              await new Promise(resolve => setTimeout(resolve, 500));
              // Try the request again
              return await apiRequest(method, url, data);
            }
          } catch (e) {
            console.log("Development recovery failed");
          }
        }
      }
    }
    
    await throwIfResNotOk(res);
    logDebug("API request successful", { url, method, status: res.status });
    return res;
  } catch (error: any) {
    console.error("API request error:", error);
    logError("API request failed", {
      url,
      method,
      message: error?.message || "Unknown error",
      stack: error?.stack
    });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // If we're accessing authenticated resources, check session first
      const requestUrl = queryKey[0] as string;
      logDebug("Query function called", { requestUrl });
      
      if (requestUrl.includes('/api/') && !requestUrl.includes('/api/auth/') && !sessionChecked) {
        const msg = "Checking session before API call...";
        console.log(msg);
        logDebug(msg, { requestUrl });
        
        const isLoggedIn = await checkSession();
        
        if (!isLoggedIn) {
          const redirectMsg = "Not logged in, redirecting to login page";
          console.log(redirectMsg);
          logWarn(redirectMsg, { requestUrl });
          window.location.href = '/login';
          return null;
        }
        
        const successMsg = "Session check successful, proceeding with API call";
        console.log(successMsg);
        logInfo(successMsg, { requestUrl });
      }
      
      // Add timestamp to URL to prevent caching
      const timestampedUrl = requestUrl.includes('?') 
        ? `${requestUrl}&_t=${Date.now()}` 
        : `${requestUrl}?_t=${Date.now()}`;
      
      // Perform the fetch with retries for network errors
      let retries = 0;
      const MAX_RETRIES = 2;
      let res: Response;
      
      while (true) {
        try {
          res = await fetch(timestampedUrl, {
            credentials: "include",
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          break; // Success, exit retry loop
        } catch (networkError: any) {
          retries++;
          if (retries > MAX_RETRIES) {
            logError("Network request failed after retries", {
              requestUrl,
              retries,
              error: networkError?.message || "Unknown network error"
            });
            throw networkError; // Re-throw after max retries
          }
          
          logWarn("Network request failed, retrying...", {
            requestUrl,
            retry: retries,
            error: networkError?.message
          });
          
          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retries)));
        }
      }

      // Check for 401 (unauthorized) status
      if (res.status === 401) {
        // If it's an API route, check session again and redirect to login if needed
        if (requestUrl.includes('/api/') && !requestUrl.includes('/api/auth/')) {
          const recheckMsg = "Received 401, checking session again...";
          console.log(recheckMsg);
          logWarn(recheckMsg, { requestUrl, status: res.status });
          
          const isLoggedIn = await checkSession();
          
          if (!isLoggedIn) {
            const expiredMsg = "Session expired, redirecting to login page";
            console.log(expiredMsg);
            logWarn(expiredMsg, { requestUrl });
            window.location.href = '/login';
            return null;
          } else {
            const mismatchMsg = "Session valid but got 401 - session mismatch or server error";
            console.log(mismatchMsg);
            logError(mismatchMsg, { requestUrl });
            throw new Error("Session error - please try refreshing the page");
          }
        }
        
        // Handle based on behavior option
        if (unauthorizedBehavior === "returnNull") {
          logDebug("Returning null on 401 per behavior option", { requestUrl });
          return null;
        }
      }

      await throwIfResNotOk(res);
      logDebug("Query successful", { requestUrl, status: res.status });
      return await res.json();
    } catch (error: any) {
      console.error("Query error:", error);
      logError("Query function error", {
        requestUrl: queryKey[0] as string,
        message: error?.message || "Unknown error",
        stack: error?.stack
      });
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
