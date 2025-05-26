import { Switch, Route } from "wouter";
import { queryClient, checkSession } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import DirectLogin from "@/pages/DirectLogin";
import TranscriptView from "@/pages/TranscriptView";
import AllTranscripts from "@/pages/AllTranscripts";
import Settings from "@/pages/Settings";
import SubscriptionPage from "@/pages/SubscriptionNew";
import SubscriptionSecure from "@/pages/SubscriptionSecure";
import LeadershipInspirations from "@/pages/LeadershipInspirations";
import Progress from "@/pages/Progress";
import Training from "@/pages/Training";
import ModuleView from "@/pages/ModuleView";
import SituationView from "@/pages/SituationView";
import NextSituation from "@/pages/NextSituation";
import Recording from "@/pages/Recording";
import TestSituation from "@/pages/TestSituation";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";
import { logInfo, logError, logDebug } from "@/lib/debugLogger";
import SplashScreen from "@/components/SplashScreen";
import { handleRedirectResult } from "./firebase";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for redirect result first (for iOS/Safari users returning from Google auth)
        try {
          await handleRedirectResult();
        } catch (redirectError) {
          console.log("No redirect result or error handling redirect:", redirectError);
        }

        // Then check session status through our debug endpoint
        const isLoggedIn = await checkSession();

        if (window.location.pathname === "/login" || window.location.pathname === "/") {
          // Skip further checks if we're already on login page to prevent redirect loops
          if (!isLoggedIn) {
            console.log("On login page, session check shows not logged in");
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }

        if (!isLoggedIn) {
          console.log("Session check shows not logged in");
          setIsAuthenticated(false);
          setOnboardingComplete(false);
          setLoading(false);
          return;
        }
        
        // Session looks good, get user details
        console.log("Session check successful, fetching user details");
        try {
          // Try to fetch the current user
          const res = await apiRequest('GET', '/api/users/me');
          
          if (res.ok) {
            setIsAuthenticated(true);
            const userData = await res.json();
            
            // Check if onboarding is complete
            setOnboardingComplete(
              !!(userData.dateOfBirth && userData.profession && userData.goals && userData.selectedLeaders)
            );
          } else {
            console.log("User fetch failed despite active session");
            setIsAuthenticated(false);
            setOnboardingComplete(false);
          }
        } catch (userError) {
          console.error("User fetch error:", userError);
          setIsAuthenticated(false);
          setOnboardingComplete(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setOnboardingComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated]);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen initially
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading spinner after splash screen if still loading
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth required routes */}
      {isAuthenticated && onboardingComplete && <Route path="/" component={Dashboard} />}
      {isAuthenticated && onboardingComplete && <Route path="/dashboard" component={Dashboard} />}
      {isAuthenticated && onboardingComplete && <Route path="/transcript/:id" component={TranscriptView} />}
      {isAuthenticated && onboardingComplete && <Route path="/transcripts" component={AllTranscripts} />}
      {isAuthenticated && onboardingComplete && <Route path="/progress" component={Progress} />}
      {isAuthenticated && onboardingComplete && <Route path="/settings" component={Settings} />}
      {isAuthenticated && onboardingComplete && <Route path="/subscription" component={SubscriptionSecure} />}
      {isAuthenticated && onboardingComplete && <Route path="/subscription/new" component={SubscriptionSecure} />}

      {isAuthenticated && onboardingComplete && <Route path="/leadership-inspirations" component={LeadershipInspirations} />}
      
      {/* Training module routes */}
      {isAuthenticated && onboardingComplete && <Route path="/training" component={Training} />}
      {/* Legacy routes for backward compatibility */}
      {isAuthenticated && onboardingComplete && <Route path="/training/module/:id" component={ModuleView} />}
      {isAuthenticated && onboardingComplete && <Route path="/training/situation/:id" component={SituationView} />}
      {isAuthenticated && onboardingComplete && <Route path="/training/next-situation" component={NextSituation} />}
      {/* New hierarchical routes */}
      {isAuthenticated && onboardingComplete && <Route path="/training/chapter/:chapterId/module/:moduleId" component={ModuleView} />}
      {isAuthenticated && onboardingComplete && <Route path="/training/chapter/:chapterId/module/:moduleId/situation/:id" component={SituationView} />}
      {isAuthenticated && onboardingComplete && <Route path="/training/chapter/:chapterId/next-situation" component={NextSituation} />}
      
      {/* Recording page */}
      {isAuthenticated && onboardingComplete && <Route path="/recording" component={Recording} />}
      
      {/* Test the new submission flow */}
      {isAuthenticated && onboardingComplete && <Route path="/test-situation" component={TestSituation} />}
      
      {/* Onboarding routes */}
      {isAuthenticated && !onboardingComplete && <Route path="/" component={Onboarding} />}
      {isAuthenticated && <Route path="/onboarding" component={Onboarding} />}
      
      {/* Login routes - ensure both root and /login path work */}
      {!isAuthenticated && <Route path="/" component={DirectLogin} />}
      {!isAuthenticated && <Route path="/login" component={DirectLogin} />}
      
      {/* Force redirect auth-required paths to login when not authenticated */}
      {!isAuthenticated && <Route path="/dashboard" component={DirectLogin} />}
      {!isAuthenticated && <Route path="/transcript/:id" component={DirectLogin} />}
      {!isAuthenticated && <Route path="/transcripts" component={DirectLogin} />}
      {!isAuthenticated && <Route path="/progress" component={DirectLogin} />}
      
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
