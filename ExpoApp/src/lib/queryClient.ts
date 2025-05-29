import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { logInfo, logError, logDebug, logWarn } from "./debugLogger";
import { checkSession } from "./api";

// Type for handling unauthorized behavior
type UnauthorizedBehavior = "returnNull" | "throw";

// Create a query function that handles authentication and error cases
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Extract the URL from the query key
      const requestUrl = queryKey[0] as string;
      logDebug("Query function called", { requestUrl });
      
      // If we're accessing authenticated resources, check session first
      if (requestUrl.includes('/api/') && !requestUrl.includes('/api/auth/')) {
        const msg = "Checking session before API call...";
        console.log(msg);
        logDebug(msg, { requestUrl });
        
        const isLoggedIn = await checkSession();
        
        if (!isLoggedIn) {
          const redirectMsg = "Not logged in, cannot proceed with API call";
          console.log(redirectMsg);
          logWarn(redirectMsg, { requestUrl });
          
          // Handle based on behavior option
          if (unauthorizedBehavior === "returnNull") {
            return null;
          } else {
            throw new Error("Unauthorized - Not logged in");
          }
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
        // If it's an API route, check session again
        if (requestUrl.includes('/api/') && !requestUrl.includes('/api/auth/')) {
          const recheckMsg = "Received 401, checking session again...";
          console.log(recheckMsg);
          logWarn(recheckMsg, { requestUrl, status: res.status });
          
          const isLoggedIn = await checkSession();
          
          if (!isLoggedIn) {
            const expiredMsg = "Session expired or invalid";
            console.log(expiredMsg);
            logWarn(expiredMsg, { requestUrl });
            
            // Handle based on behavior option
            if (unauthorizedBehavior === "returnNull") {
              logDebug("Returning null on 401 per behavior option", { requestUrl });
              return null;
            } else {
              throw new Error("Unauthorized - Session invalid");
            }
          } else {
            const mismatchMsg = "Session valid but got 401 - session mismatch or server error";
            console.log(mismatchMsg);
            logError(mismatchMsg, { requestUrl });
            throw new Error("Session error - please try again");
          }
        }
      }

      // Handle other error responses
      if (!res.ok) {
        const text = await res.text();
        const errorMsg = `${res.status}: ${text || res.statusText}`;
        logError("API request failed", {
          status: res.status,
          statusText: res.statusText,
          responseText: text,
          url: res.url
        });
        throw new Error(errorMsg);
      }
      
      // Parse successful response
      logDebug("Query successful", { requestUrl, status: res.status });
      const text = await res.text();
      return text ? JSON.parse(text) : null;
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

// Create and export the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
