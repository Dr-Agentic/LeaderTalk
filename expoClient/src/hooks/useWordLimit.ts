import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/apiService';

export interface WordUsageData {
  currentUsage?: number;
  wordLimit?: number;
  error?: string;
}

export function useWordLimit() {
  const { 
    data: wordUsageData, 
    isLoading: isCheckingWordLimit,
    error: wordLimitError,
    refetch: refetchWordUsage
  } = useQuery<WordUsageData>({
    queryKey: ["/api/users/word-usage"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/users/word-usage');
        return await response.json();
      } catch (error) {
        console.error('Error fetching word usage:', error);
        return { error: 'Failed to fetch word usage data' };
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use API response values directly without fallbacks
  const currentUsage = wordUsageData?.currentUsage;
  const wordLimit = wordUsageData?.wordLimit;
  
  // Only consider word limit data valid if loaded and greater than 0
  const hasWordLimitData = !isCheckingWordLimit && wordLimit !== undefined && wordLimit > 0;
  
  // Calculate if limit exceeded only if we have valid limit data
  const hasExceededWordLimit = hasWordLimitData && currentUsage !== undefined ? currentUsage >= wordLimit : false;

  return {
    wordUsageData,
    isCheckingWordLimit,
    wordLimitError,
    refetchWordUsage,
    currentUsage,
    wordLimit,
    hasWordLimitData,
    hasExceededWordLimit,
  };
}
