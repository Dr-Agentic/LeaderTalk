import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthState {
  currentUser: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userData: any | null;
  onboardingComplete: boolean;
}

export function useAuth(): AuthState {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await apiRequest('GET', '/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
          setUserData(data);
          setIsAuthenticated(true);
          
          // Check if onboarding is complete
          setOnboardingComplete(
            !!(data.dateOfBirth && data.profession && data.goals && data.selectedLeaders)
          );
        } else {
          setCurrentUser(null);
          setUserData(null);
          setIsAuthenticated(false);
          setOnboardingComplete(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setCurrentUser(null);
        setUserData(null);
        setIsAuthenticated(false);
        setOnboardingComplete(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);
  
  return {
    currentUser,
    isAuthenticated,
    isLoading,
    userData,
    onboardingComplete
  };
}
