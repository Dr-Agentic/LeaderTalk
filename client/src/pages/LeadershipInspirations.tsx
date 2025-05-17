import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import LeaderSelection from "@/components/onboarding/LeaderSelection";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/BackButton";

// Interface to match the LeaderSelection component's expected format
interface LeaderData {
  id: number;
  name: string;
  title: string;
  description: string;
  traits?: string[];
  biography?: string;
  photoUrl?: string;
  controversial?: boolean;
  generationMostAffected?: string;
  leadershipStyles?: string[];
  famousPhrases?: string[];
}

export default function LeadershipInspirations() {
  const { userData } = useAuth();
  
  // Fetch leaders data
  const { data: leaders, isLoading: isLoadingLeaders } = useQuery({
    queryKey: ['/api/leaders'],
  });
  
  return (
    <div className="container mx-auto py-10 px-4">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <div className="flex items-center justify-between my-8">
        <h1 className="text-3xl font-bold">Leadership Inspirations</h1>
      </div>
      
      {isLoadingLeaders ? (
        <LeadershipInspirationsSkeleton />
      ) : (
        <Card className="p-6">
          <LeaderSelection 
            leaders={Array.isArray(leaders) ? 
              leaders.map(leader => ({
                ...leader,
                traits: leader.traits || [],
                photoUrl: leader.photoUrl || '',
                generationMostAffected: leader.generationMostAffected || '',
                leadershipStyles: leader.leadershipStyles || [],
                famousPhrases: leader.famousPhrases || []
              })) : []
            } 
            currentSelections={userData?.selectedLeaders || []}
            isSettingsPage={true}
          />
        </Card>
      )}
    </div>
  );
}

function LeadershipInspirationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
      <Skeleton className="h-8 w-32 mb-4" /> {/* BackButton skeleton */}
      <div className="text-center mb-6">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-96 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto mt-1" />
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="p-4">
              <Skeleton className="w-full h-36 rounded-md mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-1" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}