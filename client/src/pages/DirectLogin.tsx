import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { signInWithGoogle } from "@/firebase";
import { logDebug, logError, logInfo, logWarn } from "@/lib/debugLogger";
import { Checkbox } from "@/components/ui/checkbox";

export default function DirectLogin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  const handleDirectLogin = async () => {
    try {
      setIsLoading(true);
      console.log("Starting demo login process...");
      logInfo("Demo login process initiated");
      
      // Show loading state
      const button = document.getElementById('demo-login-button');
      if (button) {
        button.textContent = "Logging in...";
        button.setAttribute('disabled', 'true');
      }
      
      console.log("Sending force-login request to server...");
      logInfo("Attempting demo login via force-login endpoint");
      
      // Use enhanced fetching approach with cache-busting
      const fetchOptions: RequestInit = {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      
      // Add timestamp to URL to prevent caching
      const url = "/api/auth/force-login";
      const timestampedUrl = `${url}?_t=${Date.now()}`; 
      
      // Add retry mechanism for network issues
      let retries = 0;
      const MAX_RETRIES = 2;
      let response: Response;
      
      while (true) {
        try {
          response = await fetch(timestampedUrl, fetchOptions);
          break; // Success, exit retry loop
        } catch (networkError: any) {
          retries++;
          if (retries > MAX_RETRIES) {
            console.error("Network request failed after retries:", networkError);
            logError("Demo login network request failed after retries", {
              error: networkError?.message || "Unknown network error"
            });
            throw networkError; // Re-throw after max retries
          }
          
          console.log(`Network request failed, retrying (${retries}/${MAX_RETRIES})...`);
          logWarn("Demo login network request failed, retrying...", {
            retry: retries,
            error: networkError?.message
          });
          
          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, retries)));
        }
      }
      
      console.log("Force login response received:", {
        status: response.status,
        statusText: response.statusText,
        redirected: response.redirected,
        redirectUrl: response.redirected ? response.url : 'none',
        ok: response.ok,
        type: response.type
      });
      
      try {
        // Try to get header info for debugging
        const headerInfo = [...response.headers].map(([key, value]) => `${key}: ${value}`).join(', ');
        console.log("Response headers:", headerInfo);
      } catch (headerError) {
        console.log("Could not log response headers due to browser restrictions");
      }
      
      if (response.ok || response.redirected) {
        console.log("Login successful, checking onboarding status...");
        
        try {
          // Check if user needs to complete onboarding
          const userResponse = await apiRequest('GET', '/api/users/me');
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            
            // Determine where to redirect based on onboarding completion
            if (userData.dateOfBirth && userData.profession && userData.goals && userData.selectedLeaders) {
              // Onboarding complete, go to dashboard
              console.log("Onboarding complete, redirecting to dashboard");
              window.location.href = "/dashboard";
            } else {
              // Onboarding incomplete, go to onboarding
              console.log("Onboarding incomplete, redirecting to onboarding");
              window.location.href = "/onboarding";
            }
          } else {
            // If we can't get user data, default to onboarding page
            console.log("Could not fetch user data, redirecting to onboarding as fallback");
            window.location.href = "/onboarding";
          }
        } catch (userError) {
          console.error("Error checking user status:", userError);
          // If error occurred, still try to go to dashboard as fallback
          window.location.href = "/dashboard";
        }
      } else {
        const responseText = await response.text();
        console.error("Login failed:", responseText);
        console.error("Status:", response.status, response.statusText);
        
        toast({
          title: "Login Failed",
          description: `Could not log in (${response.status}). Please try again.`,
          variant: "destructive"
        });
        
        // Reset button state
        setIsLoading(false);
        if (button) {
          button.textContent = "Log in as Demo User";
          button.removeAttribute('disabled');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      
      // Reset loading state
      setIsLoading(false);
      
      // Reset button state
      const button = document.getElementById('demo-login-button');
      if (button) {
        button.textContent = "Log in as Demo User";
        button.removeAttribute('disabled');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Log Firebase configuration for debugging
      const configInfo = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present (hidden)" : "Missing",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present (hidden)" : "Missing",
        authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
        currentUrl: window.location.href,
        currentOrigin: window.location.origin,
        environment: import.meta.env.NODE_ENV
      };
      
      console.log("Firebase config being used:", configInfo);
      logDebug("Attempting Google sign-in with config", configInfo);
      
      console.log("Starting Google sign-in popup...");
      console.log("Force onboarding checkbox is:", forceOnboarding);
      logInfo("Google sign-in process initiated from UI");
      
      // Use the popup authentication
      const user = await signInWithGoogle();
      console.log("Google sign-in completed successfully", user);
      logInfo("Google sign-in completed successfully in UI component");
      
      // Redirect to dashboard or onboarding based on user data
      if (user) {
        logDebug("Checking user onboarding status");
        // Check if we need to show onboarding (no selected leaders, etc)
        const userResponse = await apiRequest('GET', '/api/users/me');
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          logDebug("User data received from server", { 
            hasSelectedLeaders: !!userData.selectedLeaders,
            hasDateOfBirth: !!userData.dateOfBirth,
            hasProfession: !!userData.profession,
            hasGoals: !!userData.goals,
            forceOnboarding: forceOnboarding
          });
          
          // Check force onboarding FIRST, before any other logic
          if (forceOnboarding) {
            console.log("Force onboarding requested, resetting user data...");
            logInfo("Force onboarding requested, resetting user data");
            
            try {
              await apiRequest('PATCH', '/api/users/me', {
                dateOfBirth: null,
                profession: null,
                goals: null,
                selectedLeaders: null,
                preferredLeadershipStyle: null,
              });
              console.log("User data reset successfully, redirecting to onboarding...");
              logInfo("User data reset successfully, redirecting to onboarding");
              window.location.href = "/onboarding";
              return; // Important: Exit early to prevent further logic
            } catch (resetError) {
              console.error("Error resetting user data:", resetError);
              logError("Error resetting user data", { error: resetError });
              // Still go to onboarding even if reset fails
              console.log("Reset failed but still redirecting to onboarding...");
              window.location.href = "/onboarding";
              return; // Important: Exit early
            }
          }
          
          // Only check normal onboarding logic if force onboarding is NOT enabled
          if (!userData.selectedLeaders || !userData.dateOfBirth || !userData.profession || !userData.goals) {
            console.log("User needs onboarding, redirecting to /onboarding...");
            logInfo("User needs onboarding, redirecting to /onboarding");
            window.location.href = "/onboarding";
          } else {
            // User has completed onboarding, go to dashboard
            console.log("User already onboarded, redirecting to dashboard...");
            logInfo("User already onboarded, redirecting to dashboard");
            window.location.href = "/dashboard";
          }
        } else {
          const responseText = await userResponse.text();
          console.error("Failed to get user data from server:", responseText);
          logError("Failed to get user data from server", {
            status: userResponse.status,
            statusText: userResponse.statusText,
            responseText
          });
          
          // If we can't determine, just go to dashboard
          logWarn("Could not determine onboarding status, redirecting to home as fallback");
          window.location.href = "/";
        }
      }
    } catch (error: any) {
      console.error("Google sign in error:", error);
      console.error("Error details:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      });
      
      logError("Google sign-in error in UI component", {
        code: error?.code || "unknown",
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace",
        url: window.location.href
      });
      
      setIsLoading(false);
      
      // Show error toast with more details
      toast({
        title: "Authentication Error",
        description: `${error?.code || 'unknown'}: ${error?.message || 'Unknown error'}. Please try again or use the demo login.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LeaderTalk</h1>
          <p className="text-slate-500">AI-Powered Communication Coaching</p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-sm text-blue-700">
              Transform your leadership communication skills with personalized AI coaching.
            </p>
          </div>

          {/* Testing mode checkbox */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox 
              id="force-onboarding" 
              checked={forceOnboarding}
              onCheckedChange={(checked) => setForceOnboarding(checked === true)}
            />
            <label 
              htmlFor="force-onboarding" 
              className="text-sm text-gray-600 cursor-pointer"
            >
              Test onboarding flow (resets profile data)
            </label>
          </div>
          
          <Button
            variant="default"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg 
              className="h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 48 48" 
              width="48px" 
              height="48px"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </div>

        <div className="text-center text-xs text-slate-500 mt-6 pt-2 border-t border-slate-200">
          <p className="mb-2">By continuing, you agree to our <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link></p>
          <p>© 2025 LeaderTalk. All rights reserved.</p>
        </div>
      </Card>
    </div>
  );
}