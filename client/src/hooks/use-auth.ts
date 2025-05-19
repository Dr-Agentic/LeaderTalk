import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  googleId?: string;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  profession?: string | null;
  goals?: string | null;
  selectedLeaders?: number[] | null;
  subscriptionPlan?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  lastPaymentDate?: Date | null;
  nextBillingDate?: Date | null;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  // Fetch the current user's data
  const { data, status, error, isLoading, isError } = useQuery<User>({
    queryKey: ["/api/users/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to refresh user data
  const refreshUserData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
  };

  // Function to log out
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      await queryClient.invalidateQueries();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Check if user is logged in
  const isLoggedIn = status === "success" && !!data?.id;

  return {
    userData: data,
    isLoading,
    isError,
    error,
    isLoggedIn,
    refreshUserData,
    logout,
  };
}