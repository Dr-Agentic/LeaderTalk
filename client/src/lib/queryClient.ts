import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Session state to track auth state
let sessionChecked = false;
let currentSessionId = '';
let currentUserId: number | null = null;

export async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/debug/session', {
      credentials: 'include', // Ensure cookies are sent
      cache: 'no-cache'       // Prevent caching
    });
    
    if (!response.ok) {
      console.error(`Session check failed: ${response.status} ${response.statusText}`);
      sessionChecked = true;
      return false;
    }
    
    const data = await response.json();
    
    // Update our tracking variables
    sessionChecked = true;
    
    // Track if session ID changes, which would indicate a new login
    const previousSessionId = currentSessionId;
    currentSessionId = data.sessionId || '';
    
    if (previousSessionId && currentSessionId && previousSessionId !== currentSessionId) {
      console.log("Session ID changed - user likely logged out and back in");
    }
    
    currentUserId = data.userId || null;
    
    // Log session status
    if (data.sessionExists && data.isLoggedIn) {
      console.log(`Session confirmed valid, user ID: ${currentUserId || 'unknown'}`);
      return true;
    } else if (data.sessionExists && !data.isLoggedIn) {
      console.log("Session exists but not logged in (likely expired)");
      return false;
    } else {
      console.log("No valid session found");
      return false;
    }
  } catch (error) {
    console.error("Auth check error:", error);
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
        console.log(`Redirecting from API to: ${data.redirectUrl}`);
        window.location.href = data.redirectUrl;
        return; // Stop processing, redirection will happen
      }
    } catch (e) {
      // Not JSON or doesn't have redirect info, treat as error
    }
  }
  
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // For authenticated API routes, check session first
    if (url.includes('/api/') && !url.includes('/api/auth/') && method !== 'GET') {
      try {
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
          console.log("Session check prior to API call shows not logged in, redirecting...");
          window.location.href = '/login';
          throw new Error("Unauthorized - Session invalid");
        }
      } catch (sessionError) {
        console.error("Session check error:", sessionError);
        // Continue with request, server will handle auth validation
      }
    }
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // Special case for unauthorized - redirect to login page
    if (res.status === 401 && url.includes('/api/') && !url.includes('/api/auth/')) {
      console.log("Unauthorized response, checking session again...");
      
      // Double-check session status
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        console.log("Confirmed session is invalid, redirecting to login...");
        window.location.href = '/login';
        return res; // Skip throwing error
      } else {
        console.log("Session appears valid but got 401 - possible server-side auth mismatch");
      }
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API request error:", error);
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
      const url = queryKey[0] as string;
      if (url.includes('/api/') && !url.includes('/api/auth/') && !sessionChecked) {
        console.log("Checking session before API call...");
        const isLoggedIn = await checkSession();
        
        if (!isLoggedIn) {
          console.log("Not logged in, redirecting to login page");
          window.location.href = '/login';
          return null;
        }
        console.log("Session check successful, proceeding with API call");
      }
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      // Check for 401 (unauthorized) status
      if (res.status === 401) {
        // If it's an API route, check session again and redirect to login if needed
        if (url.includes('/api/') && !url.includes('/api/auth/')) {
          console.log("Received 401, checking session again...");
          const isLoggedIn = await checkSession();
          
          if (!isLoggedIn) {
            console.log("Session expired, redirecting to login page");
            window.location.href = '/login';
            return null;
          } else {
            console.log("Session valid but got 401 - session mismatch or server error");
            throw new Error("Session error - please try refreshing the page");
          }
        }
        
        // Handle based on behavior option
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("Query error:", error);
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
