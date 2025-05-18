import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { H2 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

// Interface for leader data
interface Leader {
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
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch leaders data
  const { data: leaders, isLoading: isLoadingLeaders } = useQuery({
    queryKey: ['/api/leaders'],
  });
  
  // Active selections - always exactly 3 slots, with null for empty slots
  const [selectedSlots, setSelectedSlots] = useState<(number | null)[]>([null, null, null]);
  
  // Initialize slots from user data when it loads
  useEffect(() => {
    if (userData?.selectedLeaders && Array.isArray(userData.selectedLeaders)) {
      // Create a fixed array of 3 slots filled with nulls
      const slots = [null, null, null] as (number | null)[];
      
      // Fill slots with user's selected leaders
      userData.selectedLeaders.forEach((id: number, index: number) => {
        if (index < 3) {
          slots[index] = id;
        }
      });
      
      setSelectedSlots(slots);
    }
  }, [userData]);
  
  // Toggle a leader selection
  const toggleLeader = (leaderId: number) => {
    // Check if this leader is already selected
    const existingIndex = selectedSlots.indexOf(leaderId);
    
    if (existingIndex !== -1) {
      // Leader is already selected - remove it
      const newSlots = [...selectedSlots];
      newSlots[existingIndex] = null;
      setSelectedSlots(newSlots);
    } else {
      // Leader is not selected - try to add it
      const firstEmptyIndex = selectedSlots.findIndex(slot => slot === null);
      
      if (firstEmptyIndex !== -1) {
        // Empty slot found - add the leader
        const newSlots = [...selectedSlots];
        newSlots[firstEmptyIndex] = leaderId;
        setSelectedSlots(newSlots);
      } else {
        // No empty slots - show error
        toast({
          title: "Maximum leaders reached",
          description: "You can only select up to 3 leaders. Please remove a leader before adding a new one.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Save selections to the database
  const saveSelections = async () => {
    // Filter out nulls to get a clean array of IDs
    const selectedLeaderIds = selectedSlots.filter((id): id is number => id !== null);
    
    if (selectedLeaderIds.length === 0) {
      toast({
        title: "No leaders selected",
        description: "Please select at least one leader who inspires you.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save to backend
      const response = await apiRequest('PATCH', '/api/users/me', {
        selectedLeaders: selectedLeaderIds
      });
      
      if (response.ok) {
        toast({
          title: "Leaders saved",
          description: "Your leadership inspirations have been saved successfully."
        });
        
        // Refresh data
        await queryClient.invalidateQueries({
          queryKey: ['/api/users/me']
        });
      } else {
        throw new Error("Failed to save leader selections");
      }
    } catch (error) {
      console.error("Error saving leaders:", error);
      toast({
        title: "Error",
        description: "Failed to save leaders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
                // Get leader ID from the fixed-size array (could be null)
                const leaderId = selectedSlots[index];
                // Find the leader object from the ID if it exists
                const selectedLeader = leaderId !== null && Array.isArray(leaders) ? 
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
                            onClick={() => toggleLeader(selectedLeader.id)}
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
          
          {/* Leader Selection Grid */}
          <Card className="p-6">
            <H2 className="text-xl mb-4">Available Leaders</H2>
            <p className="text-gray-600 mb-6">
              Select from our curated list of leaders to inspire your communication style.
            </p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(leaders) && leaders
                .filter(leader => !leader.controversial) // Filter out controversial leaders
                .map((leader) => {
                  // Check if this leader is already selected
                  const isSelected = selectedSlots.includes(leader.id);
                  
                  return (
                    <div 
                      key={leader.id}
                      className={`relative bg-white overflow-hidden rounded-lg border ${
                        isSelected ? "border-primary border-2" : "border-gray-200"
                      } hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => toggleLeader(leader.id)}
                    >
                      {/* Selected badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-primary text-white text-xs font-medium py-1 px-2 rounded-full">
                            Selected
                          </div>
                        </div>
                      )}
                      
                      {/* Leader image */}
                      {leader.photoUrl ? (
                        <img 
                          src={leader.photoUrl} 
                          alt={leader.name} 
                          className="w-full h-52 object-cover"
                        />
                      ) : (
                        <div className="w-full h-52 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-lg">{leader.name}</h3>
                        <p className="text-gray-500 text-sm">{leader.title}</p>
                        
                        <p className="mt-3 text-gray-700 text-sm line-clamp-3">
                          {leader.description}
                        </p>
                        
                        {/* Leadership styles tags */}
                        {leader.leadershipStyles && leader.leadershipStyles.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {leader.leadershipStyles.map((style: string, index: number) => (
                              <div 
                                key={index} 
                                className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-full"
                              >
                                {style}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Save Button */}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={saveSelections}
                disabled={isSaving || selectedSlots.every(slot => slot === null)}
                className="px-6"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
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