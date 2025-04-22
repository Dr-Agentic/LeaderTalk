import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";

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

export default function LeaderSelection({ 
  leaders, 
  onComplete, 
  currentSelections = [], 
  isSettingsPage = false 
}: LeaderSelectionProps) {
  const MAX_SELECTIONS = 3;
  
  // Filter out controversial leaders
  const availableLeaders = leaders.filter(leader => !leader.controversial);
  
  // Initialize with current selections if they exist
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>(currentSelections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [currentLeader, setCurrentLeader] = useState<LeaderData | null>(null);
  const { toast } = useToast();
  
  const toggleLeaderSelection = (leaderId: number) => {
    setSelectedLeaders(prev => {
      if (prev.includes(leaderId)) {
        // Remove the leader
        return prev.filter(id => id !== leaderId);
      } else {
        // Add the leader, but check if we've reached the maximum
        if (prev.length >= MAX_SELECTIONS) {
          toast({
            title: "Maximum leaders reached",
            description: `You can only select up to ${MAX_SELECTIONS} leaders. Please deselect one before adding another.`,
            variant: "destructive",
          });
          return prev;
        }
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
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('PATCH', '/api/users/me', {
        selectedLeaders,
      });
      
      if (response.ok) {
        toast({
          title: "Leaders selected",
          description: "Your leadership inspirations have been saved.",
        });
        
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error("Failed to save selected leaders");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your selections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowLeaderInfo = (leader: LeaderData, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from toggling selection
    setCurrentLeader(leader);
    setShowInfoDialog(true);
  };
  
  if (!availableLeaders || availableLeaders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose Leaders That Inspire You</h2>
          <p className="text-gray-600 mt-1">We'll analyze your communication based on their style</p>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          No leaders available. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSettingsPage ? "Modify Your Leadership Inspirations" : "Choose Leaders That Inspire You"}
        </h2>
        <p className="text-gray-600 mt-1">
          Select up to {MAX_SELECTIONS} leaders whose communication style you admire.
          <br />
          We'll analyze your speaking patterns and provide insights based on their techniques.
        </p>
        <p className="text-primary font-medium mt-2">
          {selectedLeaders.length} of {MAX_SELECTIONS} leaders selected
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {availableLeaders.map(leader => (
          <div 
            key={leader.id}
            className={`relative bg-white overflow-hidden rounded-lg border ${
              selectedLeaders.includes(leader.id)
                ? "border-primary border-2"
                : "border-gray-200"
            } hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => toggleLeaderSelection(leader.id)}
          >
            {/* Selected badge */}
            {selectedLeaders.includes(leader.id) && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="default" className="bg-primary text-white">
                  Selected
                </Badge>
              </div>
            )}
            
            <div className="p-4">
              {/* Use remote image URL from leader data */}
              {leader.photoUrl ? (
                <img 
                  src={leader.photoUrl} 
                  alt={leader.name} 
                  className="w-full h-36 object-cover rounded-md mb-4" 
                />
              ) : (
                <div className="w-full h-36 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{leader.name}</h3>
                  <p className="text-sm text-gray-500">{leader.title}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full" 
                        onClick={(e) => handleShowLeaderInfo(leader, e)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View full details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="mt-3 flex gap-2 flex-wrap">
                {leader.traits && leader.traits.map((trait, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {trait}
                  </Badge>
                ))}
                
                {leader.leadershipStyles && leader.leadershipStyles.slice(0, 2).map((style, index) => (
                  <Badge key={`style-${index}`} variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    {style}
                  </Badge>
                ))}
              </div>
              
              <p className="mt-3 text-sm text-gray-600 line-clamp-3">{leader.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedLeaders.length === 0}
          className="px-6"
        >
          {isSubmitting ? "Saving..." : isSettingsPage ? "Save Changes" : "Continue to Dashboard"}
        </Button>
      </div>
      
      {/* Leader Detail Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {currentLeader && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{currentLeader.name}</DialogTitle>
                <p className="text-muted-foreground">{currentLeader.title}</p>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-1">
                  {currentLeader.photoUrl ? (
                    <img 
                      src={currentLeader.photoUrl} 
                      alt={currentLeader.name} 
                      className="w-full rounded-md object-cover" 
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-sm text-gray-500 mb-2">LEADERSHIP STYLES</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentLeader.leadershipStyles?.map((style, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-sm text-gray-500 mb-2">PERSONALITY TRAITS</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentLeader.traits?.map((trait, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {currentLeader.generationMostAffected && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-gray-500 mb-2">MOST INFLUENCED GENERATION</h4>
                      <Badge className="bg-purple-100 text-purple-800">
                        {currentLeader.generationMostAffected}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">BIOGRAPHY</h4>
                    <p className="text-gray-700 whitespace-pre-line">{currentLeader.biography}</p>
                  </div>
                  
                  {currentLeader.famousPhrases && currentLeader.famousPhrases.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-sm text-gray-500 mb-2">FAMOUS QUOTES</h4>
                      <ul className="space-y-2">
                        {currentLeader.famousPhrases.map((phrase, index) => (
                          <li key={index} className="italic pl-4 border-l-2 border-gray-300 text-gray-700">
                            "{phrase}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-sm text-gray-500 mb-2">COMMUNICATION STYLE</h4>
                    <p className="text-gray-700">{currentLeader.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setShowInfoDialog(false)}>
                  Close
                </Button>
                
                <Button
                  onClick={() => {
                    toggleLeaderSelection(currentLeader.id);
                    setShowInfoDialog(false);
                  }}
                  variant={selectedLeaders.includes(currentLeader.id) ? "destructive" : "default"}
                >
                  {selectedLeaders.includes(currentLeader.id) ? "Remove Selection" : "Select This Leader"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
