import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryClient } from '@/lib/queryClient';

// Maximum number of leaders a user can select
const MAX_SELECTIONS = 3;

// Interface to match the expected format for leader data
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

interface LeaderSelectionProps {
  leaders: LeaderData[];
  onComplete?: () => void;
  currentSelections?: number[];
  isSettingsPage?: boolean;
}

/**
 * Component for selecting inspiration leaders
 * Allows user to select up to MAX_SELECTIONS leaders and view their detailed information
 */
export default function LeaderSelection({
  leaders,
  onComplete,
  currentSelections = [],
  isSettingsPage = false,
}: LeaderSelectionProps) {
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>(currentSelections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [currentLeader, setCurrentLeader] = useState<LeaderData | null>(null);
  const { toast } = useToast();
  
  const toggleLeaderSelection = (leaderId: number) => {
    setSelectedLeaders(prev => {
      if (prev.includes(leaderId)) {
        // Always allow removing a leader
        return prev.filter(id => id !== leaderId);
      } else {
        // Adding a leader - check if we've reached the maximum
        // Count unique leaders between those in the database (currentSelections) 
        // and those selected in the UI (prev) that aren't in currentSelections
        
        // The actual total would be the unique combination of database selections and UI selections
        const allSelectionsSet = new Set([...currentSelections, ...prev]);
        
        // Count the total unique selections
        const totalUniqueSelections = allSelectionsSet.size;
        
        // Check if adding one more exceeds the maximum
        if (totalUniqueSelections >= MAX_SELECTIONS) {
          toast({
            title: "Maximum leaders reached",
            description: `You can only select up to ${MAX_SELECTIONS} leaders total. Please remove a leader from "Your Current Inspirations" before adding a new one.`,
            variant: "destructive",
          });
          return prev;
        }
        
        // We're under the limit, so add the new leader
        return [...prev, leaderId];
      }
    });
  };
  
  const handleSubmit = async () => {
    if (selectedLeaders.length === 0) {
      toast({
        title: "No leaders selected",
        description: "Please select at least one leader who inspires you.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if we're exceeding the maximum number of leaders
    if (selectedLeaders.length > MAX_SELECTIONS) {
      toast({
        title: "Too many leaders selected",
        description: `You can only select up to ${MAX_SELECTIONS} leaders. Please remove some before saving.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simply use the current selected leaders - this avoids the issue where leaders get combined with initial selections
      const response = await apiRequest('PATCH', '/api/users/me', {
        selectedLeaders: selectedLeaders,
      });
      
      if (response.ok) {
        toast({
          title: "Leaders selected",
          description: "Your leadership inspirations have been saved.",
        });
        
        // Invalidate the user data query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
        
        // If onComplete callback is provided, call it
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error("Failed to save leader selections");
      }
    } catch (error) {
      console.error("Error saving leader selections:", error);
      toast({
        title: "Error",
        description: "There was an error saving your selections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleShowLeaderInfo = (leader: LeaderData, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't toggle selection when clicking info button
    setCurrentLeader(leader);
    setShowInfoDialog(true);
  };
  
  // Filter out controversial leaders unless we're in the settings page
  const availableLeaders = leaders.filter(leader => 
    isSettingsPage || !leader.controversial
  );

  return (
    <div className="w-full max-w-6xl mx-auto pb-10 px-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 mb-4 bg-gray-50 p-3 rounded-md">
        <span className="font-medium text-gray-700">Selected:</span>
        <p className="text-sm text-gray-500 ml-2">
          {selectedLeaders.length} of {MAX_SELECTIONS} leaders selected
        </p>
      </div>
      
      {/* Show warning if user has reached max leaders */}
      {(() => {
        // The actual total would be the unique combination of database selections and UI selections
        const allSelectionsSet = new Set([...currentSelections, ...selectedLeaders]);
        
        // Count the total unique selections
        const totalUniqueSelections = allSelectionsSet.size;
        
        if (totalUniqueSelections >= MAX_SELECTIONS) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h3 className="text-amber-800 font-medium">Maximum Leaders Selected</h3>
              <p className="text-amber-700 text-sm mt-1">
                You've reached the maximum number of leaders ({MAX_SELECTIONS}). 
                Please remove a leader from "Your Current Inspirations" before adding a new one.
              </p>
            </div>
          );
        }
        return null;
      })()}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {availableLeaders.map(leader => {
          // Calculate if this leader can be selected
          const isAlreadySelected = selectedLeaders.includes(leader.id);
          
          // Create a set of all unique selections (current + UI selected)
          // but exclude this leader if it's not already selected
          const selectionsWithoutThisLeader = new Set([
            ...currentSelections,
            ...selectedLeaders.filter(id => id !== leader.id)
          ]);
          
          // Calculate how many slots we'd use if we added this leader
          const totalIfAdded = isAlreadySelected 
            ? selectionsWithoutThisLeader.size // If already selected, count without it
            : selectionsWithoutThisLeader.size + 1; // If not selected, adding it would increase by 1
          
          // Disable if adding would exceed limit (unless already selected)
          const disabled = !isAlreadySelected && totalIfAdded > MAX_SELECTIONS;
          
          return (
            <div 
              key={leader.id}
              className={`relative bg-white overflow-hidden rounded-lg border ${
                isAlreadySelected
                  ? "border-primary border-2"
                  : "border-gray-200"
              } ${
                // Disable hover effects and add opacity when max leaders reached (unless already selected)
                disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:shadow-md transition-shadow cursor-pointer"
              }`}
              onClick={() => {
                if (!disabled || isAlreadySelected) {
                  toggleLeaderSelection(leader.id);
                } else {
                  // Show toast warning when trying to select more than the maximum
                  toast({
                    title: "Maximum leaders reached",
                    description: `You can only select up to ${MAX_SELECTIONS} leaders in total. Please remove a leader from "Your Current Inspirations" before adding a new one.`,
                    variant: "destructive",
                  });
                }
              }}
            >
              {/* Selected badge */}
              {selectedLeaders.includes(leader.id) && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-primary text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
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
                  <span className="text-gray-400">No image available</span>
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
                    {leader.leadershipStyles.map((style, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                        {style}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={(e) => handleShowLeaderInfo(leader, e)}
                  className="mt-4 inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Learn more
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedLeaders.length === 0}
          className="px-6"
        >
          {isSubmitting ? 'Saving...' : isSettingsPage ? 'Save Changes' : 'Continue'}
        </Button>
      </div>

      {/* Leader info dialog */}
      {currentLeader && (
        <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{currentLeader.name}</DialogTitle>
              <DialogDescription className="text-primary font-medium">
                {currentLeader.title}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
              {/* Leader image */}
              <div className="md:col-span-1">
                {currentLeader.photoUrl ? (
                  <img 
                    src={currentLeader.photoUrl} 
                    alt={currentLeader.name} 
                    className="w-full rounded-lg object-cover shadow-md"
                  />
                ) : (
                  <div className="w-full h-52 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Leadership styles */}
                {currentLeader.leadershipStyles && currentLeader.leadershipStyles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Leadership Styles</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentLeader.leadershipStyles.map((style, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-50">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Famous phrases */}
                {currentLeader.famousPhrases && currentLeader.famousPhrases.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Famous Phrases</h4>
                    <ul className="space-y-2">
                      {currentLeader.famousPhrases.map((phrase, index) => (
                        <li key={index} className="text-sm italic bg-gray-50 p-2 rounded-md">
                          "{phrase}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Generation most affected */}
                {currentLeader.generationMostAffected && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-1">Generation Influenced</h4>
                    <p className="text-sm">{currentLeader.generationMostAffected}</p>
                  </div>
                )}
              </div>

              {/* Leader details */}
              <div className="md:col-span-2">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Overview</h4>
                    <p className="text-gray-700">{currentLeader.description}</p>
                  </div>

                  {/* Biography */}
                  {currentLeader.biography && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Biography</h4>
                      <p className="text-gray-700 whitespace-pre-line">{currentLeader.biography}</p>
                    </div>
                  )}

                  {/* Traits */}
                  {currentLeader.traits && currentLeader.traits.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Traits</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {currentLeader.traits.map((trait, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-primary mr-2" />
                            {trait}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Selection button */}
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLeaderSelection(currentLeader.id);
                        setShowInfoDialog(false);
                      }}
                      variant={selectedLeaders.includes(currentLeader.id) ? "destructive" : "default"}
                    >
                      {selectedLeaders.includes(currentLeader.id) ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Remove from selection
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Select as inspiration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}