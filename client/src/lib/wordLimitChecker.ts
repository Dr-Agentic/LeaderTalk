import { apiRequest } from "./queryClient";

/**
 * Interface for the word usage data returned from the API
 */
export interface WordUsageData {
  currentUsage: number;
  wordLimit: number;
  usagePercentage: number;
  hasExceededLimit: boolean;
}

/**
 * Check if the user has exceeded their word limit
 * @returns Promise with the word usage data
 */
export const checkWordLimit = async (): Promise<WordUsageData> => {
  const response = await apiRequest("GET", "/api/users/word-usage");
  
  // If response is not OK, throw an error
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error checking word limit:", errorData);
    throw new Error(errorData.message || "Failed to retrieve word limit information");
  }
  
  const data = await response.json();
  
  // If the server returns a wordLimit of 0, we'll show that directly
  // This is a valid response indicating that we couldn't determine the limit
  return {
    currentUsage: data.currentUsage,
    wordLimit: data.wordLimit,
    usagePercentage: data.usagePercentage,
    hasExceededLimit: data.hasExceededLimit
  };
};