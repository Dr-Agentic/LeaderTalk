import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import LeaderSelection from "@/components/onboarding/LeaderSelection";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { H2 } from "@/components/ui/typography";

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
  const [isRemovingLeader, setIsRemovingLeader] = useState(false);
  
  // Fetch leaders data and ensure it updates when user data changes
  const { data: leaders, isLoading: isLoadingLeaders } = useQuery({
    queryKey: ['/api/leaders'],
  });
  
  // Force component to update when userData changes
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<number[]>([]);
  
  // Update the local state when userData changes
  useEffect(() => {
    if (userData?.selectedLeaders) {
      setSelectedLeaderIds([...userData.selectedLeaders]);
    } else {
      setSelectedLeaderIds([]);
    }
  }, [userData]);
  
  // Function to handle leader removal
  const handleRemoveLeader = async (leaderId: number, leaderName: string) => {
    if (!userData?.selectedLeaders || isRemovingLeader) return;
    
    setIsRemovingLeader(true);
    
    try {
      // Create a new array without the removed leader
      const newSelections = userData.selectedLeaders.filter((id: number) => id !== leaderId);
      
      // Update the user's selected leaders
      const response = await apiRequest('PATCH', '/api/users/me', {
        selectedLeaders: newSelections
      });
      
      if (response.ok) {
        // Show success toast
        toast({
          title: "Leader removed",
          description: `${leaderName} has been removed from your inspirations.`,
        });
        
        // Force invalidate all user data queries to ensure UI updates
        await queryClient.invalidateQueries({ 
          queryKey: ['/api/users/me']
        });
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
    } finally {
      setIsRemovingLeader(false);
    }
  };

  return (
    <AppLayout 
      showBackButton 
      backTo="/dashboard" 
      backLabel="Back to Dashboard" 
      pageTitle="Leadership Inspirations"
    >
      {isLoadingLeaders ? (
        <LeadershipInspirationsSkeleton />
      ) : (
        <>
          {/* Current Selections Display */}
          <Card className="p-6 mb-8">
            <H2 className="text-xl mb-4">Your Current Inspirations</H2>
            <p className="text-gray-600 mb-6">
              These are the leaders who currently inspire your communication style. You can select up to 3 leaders.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {/* Always render 3 fixed slots */}
              {[0, 1, 2].map((index) => {
                // Get leader ID from our local state which updates when userData changes
                const leaderId = selectedLeaderIds[index];
                const selectedLeader = Array.isArray(leaders) ? 
                  leaders.find(leader => leader.id === leaderId) : null;
                
                // This slot has a leader assigned
                const hasLeader = !!selectedLeader;
                
                return (
                  <div 
                    key={index} 
                    className={`rounded-lg border ${hasLeader ? 'border-primary' : 'border-gray-200 bg-gray-50'} 
                    p-3 flex flex-col items-center justify-center w-1/4 max-w-[140px] h-32 transition-all duration-200`}
                  >
                    {hasLeader ? (
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
                                {selectedLeader.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          
                          <button 
                            className="absolute -top-2 -right-2 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-red-700 hover:bg-red-200 transition-colors"
                            onClick={() => handleRemoveLeader(selectedLeader.id, selectedLeader.name)}
                            disabled={isRemovingLeader}
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
                        {/* Empty slot with grayed-out appearance */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
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
            <H2 className="text-xl mb-4">Available Leaders</H2>
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
              currentSelections={selectedLeaderIds}
              isSettingsPage={true}
            />
          </Card>
        </>
      )}
    </AppLayout>
  );
}

function LeadershipInspirationsSkeleton() {
  return (
    <div className="space-y-8">
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full max-w-lg mb-6" />
        
        <div className="flex justify-center gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-32 rounded-lg" />
          ))}
        </div>
      </Card>
      
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full max-w-lg mb-6" />
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
}