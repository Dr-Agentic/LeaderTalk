import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
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
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (window.location.pathname === "/login" || window.location.pathname === "/") {
          // Skip auth check if we're already on login page to prevent redirect loops
          if (!isAuthenticated) {
            setLoading(false);
            return;
          }
        }
        
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
          console.log("Unauthorized access, redirecting to login...");
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
      {isAuthenticated && onboardingComplete && <Route path="/settings" component={Settings} />}
      
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
