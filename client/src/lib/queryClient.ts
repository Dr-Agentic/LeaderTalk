import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Session state to track auth state
let sessionChecked = false;
let currentSessionId = '';
let currentUserId: number | null = null;

export async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/debug/session');
    const data = await response.json();
    
    sessionChecked = true;
    currentSessionId = data.sessionId || '';
    currentUserId = data.userId;
    
    return data.isLoggedIn;
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
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // Special case for unauthorized - redirect to login page
    if (res.status === 401 && url.includes('/api/') && !url.includes('/api/auth/')) {
      console.log("Unauthorized access, redirecting to login...");
      // Redirect to login page, not force-login
      window.location.href = '/login';
      return res; // Skip throwing error
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
