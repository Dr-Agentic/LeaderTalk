import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userData: any | null;
  onboardingComplete: boolean;
}

export function useAuth(): AuthState {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      
      if (user) {
        try {
          const res = await apiRequest('GET', '/api/users/me');
          const data = await res.json();
          setUserData(data);
          
          // Check if onboarding is complete
          setOnboardingComplete(
            !!(data.dateOfBirth && data.profession && data.goals && data.selectedLeaders)
          );
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setOnboardingComplete(false);
        }
      } else {
        setUserData(null);
        setOnboardingComplete(false);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  return {
    currentUser,
    isAuthenticated,
    isLoading,
    userData,
    onboardingComplete
  };
}
