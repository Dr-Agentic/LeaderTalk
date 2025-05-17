import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import LeaderSelection from "@/components/onboarding/LeaderSelection";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/BackButton";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
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
        <>
          {/* Current Selections Display */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Current Inspirations</h2>
            <p className="text-gray-600 mb-6">
              These are the leaders who currently inspire your communication style. You can select up to 3 leaders.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {[0, 1, 2].map((index) => {
                const leaderId = userData?.selectedLeaders?.[index];
                const selectedLeader = Array.isArray(leaders) ? 
                  leaders.find(leader => leader.id === leaderId) : null;
                
                return (
                  <div key={index} className={`rounded-lg border ${selectedLeader ? 'border-primary' : 'border-gray-200'} p-3 flex flex-col items-center justify-center w-1/4 max-w-[140px] h-32`}>
                    {selectedLeader ? (
                      <>
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden mb-2">
                            {selectedLeader.photoUrl ? (
                              <img 
                                src={selectedLeader.photoUrl} 
                                alt={selectedLeader.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                {selectedLeader.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          
                          <button 
                            className="absolute -top-2 -right-2 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-red-700 hover:bg-red-200 transition-colors"
                            onClick={async () => {
                              if (!userData?.selectedLeaders) return;
                              
                              // Create a new array without the removed leader
                              const newSelections = userData.selectedLeaders.filter(id => id !== leaderId);
                              
                              try {
                                // Update the user's selected leaders
                                const response = await fetch('/api/users/me', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ selectedLeaders: newSelections })
                                });
                                
                                if (response.ok) {
                                  // Show success toast
                                  toast({
                                    title: "Leader removed",
                                    description: `${selectedLeader.name} has been removed from your inspirations.`,
                                  });
                                  
                                  // Invalidate cache to refresh the data
                                  queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
                                } else {
                                  throw new Error("Failed to update leader selections");
                                }
                              } catch (error) {
                                console.error("Error removing leader:", error);
                                toast({
                                  title: "Error",
                                  description: "Failed to remove leader. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            aria-label={`Remove ${selectedLeader.name}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18"></path>
                              <path d="M6 6L18 18"></path>
                            </svg>
                          </button>
                        </div>
                        
                        <h3 className="font-medium text-center text-xs mt-1">{selectedLeader.name}</h3>
                        <p className="text-xs text-gray-500 text-center mt-0.5 line-clamp-1">{selectedLeader.title}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <h3 className="font-medium text-gray-400 text-xs mt-1">Empty Slot</h3>
                        <p className="text-[10px] text-gray-400 text-center mt-0.5">Select below</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          
          {/* Leader Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Available Leaders</h2>
            <p className="text-gray-600 mb-6">
              Select from our curated list of leaders to inspire your communication style.
            </p>
            
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
        </>
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