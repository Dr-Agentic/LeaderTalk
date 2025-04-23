import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      // Check for 401 (unauthorized) status
      if (res.status === 401) {
        // If it's an API route, redirect to login page unless it's the login API itself
        const url = queryKey[0] as string;
        if (url.includes('/api/') && !url.includes('/api/auth/')) {
          console.log("Unauthorized access to API, redirecting to login page");
          // Use wouter's navigate for cleaner redirect if possible, but fallback to location
          window.location.href = '/login';
          return null;
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
