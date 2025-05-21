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
  try {
    const response = await apiRequest("GET", "/api/users/word-usage");
    const data = await response.json();
    return {
      currentUsage: data.currentUsage,
      wordLimit: data.wordLimit,
      usagePercentage: data.usagePercentage,
      hasExceededLimit: data.currentUsage >= data.wordLimit
    };
  } catch (error) {
    console.error("Error checking word limit:", error);
    // Return a default object in case of error
    return {
      currentUsage: 0,
      wordLimit: 0,
      usagePercentage: 0,
      hasExceededLimit: false
    };
  }
};