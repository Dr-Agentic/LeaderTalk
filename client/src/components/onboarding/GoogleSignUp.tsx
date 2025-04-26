import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/firebase";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "firebase/auth";
import { logDebug, logError, logInfo, logWarn } from "@/lib/debugLogger";

export default function GoogleSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();
  
  const handleSignIn = async () => {
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
      logInfo("Google sign-in process initiated from UI");
      
      // Use the popup authentication (changed from redirect to fix CORS issues)
      const user = await signInWithGoogle();
      console.log("Google sign-in completed successfully", user);
      logInfo("Google sign-in completed successfully in UI component");
      
      // Redirect to dashboard or onboarding based on user data
      if (user) {
        logDebug("Checking user onboarding status");
        // Check if we need to show onboarding (no selected leaders, etc)
        const userResponse = await fetch('/api/users/me', {
          credentials: 'include'
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          logDebug("User data received from server", { 
            hasSelectedLeaders: !!userData.selectedLeaders,
            hasDateOfBirth: !!userData.dateOfBirth,
            hasProfession: !!userData.profession,
            hasGoals: !!userData.goals
          });
          
          // If user doesn't have onboarding data, go to onboarding
          if (!userData.selectedLeaders || !userData.dateOfBirth || !userData.profession || !userData.goals) {
            console.log("User needs onboarding, redirecting to /onboarding...");
            logInfo("User needs onboarding, redirecting to /onboarding");
            window.location.href = "/onboarding";
          } else {
            // User has completed onboarding, go to dashboard
            console.log("User already onboarded, redirecting to dashboard...");
            logInfo("User already onboarded, redirecting to dashboard");
            window.location.href = "/";
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

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      console.log("Starting demo login process...");
      logInfo("Demo login process initiated");
      
      // Use fetch instead of direct navigation to prevent full page reload
      logDebug("Sending demo login request to /api/auth/force-login");
      const response = await fetch("/api/auth/force-login");
      
      if (response.ok || response.redirected) {
        console.log("Demo login successful, checking onboarding status...");
        logInfo("Demo login successful, checking onboarding status");
        
        try {
          // Check if user needs to complete onboarding
          logDebug("Checking user profile for onboarding status");
          const userResponse = await apiRequest('GET', '/api/users/me');
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            logDebug("User profile data received", { 
              hasSelectedLeaders: !!userData.selectedLeaders,
              hasDateOfBirth: !!userData.dateOfBirth,
              hasProfession: !!userData.profession,
              hasGoals: !!userData.goals
            });
            
            // Determine where to redirect based on onboarding completion
            if (userData.dateOfBirth && userData.profession && userData.goals && userData.selectedLeaders) {
              // Onboarding complete, go to dashboard
              console.log("Onboarding complete, redirecting to dashboard");
              logInfo("Demo user onboarding complete, redirecting to dashboard");
              window.location.href = "/dashboard";
            } else {
              // Onboarding incomplete, go to onboarding
              console.log("Onboarding incomplete, redirecting to onboarding");
              logInfo("Demo user needs onboarding, redirecting to onboarding page");
              window.location.href = "/onboarding";
            }
          } else {
            // If we can't get user data, default to onboarding page
            console.log("Could not fetch user data, redirecting to onboarding as fallback");
            logWarn("Could not fetch demo user data, redirecting to onboarding as fallback", {
              status: userResponse.status,
              statusText: userResponse.statusText
            });
            window.location.href = "/onboarding";
          }
        } catch (userError: any) {
          console.error("Error checking user status:", userError);
          logError("Error checking demo user status", {
            message: userError?.message || "Unknown error",
            stack: userError?.stack || "No stack trace"
          });
          
          // If error occurred, still try to go to dashboard as fallback
          logWarn("Error occurred during demo user check, redirecting to dashboard as fallback");
          window.location.href = "/dashboard";
        }
      } else {
        const responseText = await response.text();
        console.error("Demo login failed:", responseText);
        logError("Demo login failed", {
          status: response.status,
          statusText: response.statusText,
          responseText
        });
        
        toast({
          title: "Login Failed",
          description: "Could not log in as demo user. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Demo login error:", error);
      logError("Demo login unexpected error", {
        message: error?.message || "Unknown error",
        stack: error?.stack || "No stack trace"
      });
      
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome to LeaderTalk</h2>
        <p className="text-gray-600 mb-8">Analyze and improve your communication like a leader</p>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              This is a development environment. Use the Demo Login option below to test the application.
            </p>
          </div>
        </div>
      </div>
      
      <Button
        variant="default"
        className="w-full mb-4"
        onClick={handleDemoLogin}
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Login as Demo User"}
      </Button>
      
      <div className="mt-4 flex items-center">
        <div className="flex-grow h-px bg-gray-200"></div>
        <span className="px-3 text-sm text-gray-500">or</span>
        <div className="flex-grow h-px bg-gray-200"></div>
      </div>
      
      <Button
        variant="outline"
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mt-4"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        <svg 
          className="h-5 w-5 mr-2" 
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
        Sign in with Google
      </Button>
      
      <p className="text-xs text-center text-gray-500 mt-4">
        By signing up, you agree to our <a href="#" className="text-primary">Terms</a> and <a href="#" className="text-primary">Privacy Policy</a>
      </p>
    </div>
  );
}
