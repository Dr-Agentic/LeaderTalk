import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2 } from 'lucide-react';

interface Leader {
  id: number;
  name: string;
  title: string;
  description: string;
  photoUrl?: string;
  leadershipStyles?: string[];
  controversial?: boolean;
}

interface SimpleLeaderSelectionProps {
  leaders: Leader[];
  onComplete: () => void;
}

export default function SimpleLeaderSelection({ leaders, onComplete }: SimpleLeaderSelectionProps) {
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const MAX_SELECTIONS = 3;

  // Filter out controversial leaders for onboarding
  const availableLeaders = leaders.filter(leader => !leader.controversial);

  const toggleLeaderSelection = (leaderId: number) => {
    setSelectedLeaders(prev => {
      if (prev.includes(leaderId)) {
        return prev.filter(id => id !== leaderId);
      } else if (prev.length < MAX_SELECTIONS) {
        return [...prev, leaderId];
      } else {
        toast({
          title: "Maximum leaders reached",
          description: `You can only select up to ${MAX_SELECTIONS} leaders.`,
          variant: "destructive",
        });
        return prev;
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
        selectedLeaders: selectedLeaders,
      });

      if (response.ok) {
        toast({
          title: "Leaders selected",
          description: "Your leadership inspirations have been saved.",
        });
        onComplete();
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

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Choose Your Leadership Inspirations
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Select up to {MAX_SELECTIONS} leaders whose communication style inspires you. 
          We'll help you learn from their approach to leadership.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6 bg-gray-700/50 p-3 rounded-md max-w-md mx-auto border border-gray-600">
        <span className="font-medium text-gray-300">Selected:</span>
        <span className="text-primary font-bold">
          {selectedLeaders.length} of {MAX_SELECTIONS}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {availableLeaders.map(leader => {
          const isSelected = selectedLeaders.includes(leader.id);
          const canSelect = selectedLeaders.length < MAX_SELECTIONS || isSelected;

          return (
            <div 
              key={leader.id}
              className={`relative bg-gray-800 overflow-hidden rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "border-primary border-2 shadow-md"
                  : canSelect
                  ? "border-gray-700 hover:shadow-md hover:border-gray-600"
                  : "border-gray-700 opacity-50 cursor-not-allowed"
              }`}
              onClick={() => canSelect && toggleLeaderSelection(leader.id)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-primary text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                </div>
              )}
              
              {leader.photoUrl ? (
                <img 
                  src={leader.photoUrl} 
                  alt={leader.name} 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-bold text-white text-lg">{leader.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{leader.title}</p>
                
                <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                  {leader.description}
                </p>
                
                {leader.leadershipStyles && leader.leadershipStyles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {leader.leadershipStyles.slice(0, 2).map((style, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                        {style}
                      </Badge>
                    ))}
                    {leader.leadershipStyles.length > 2 && (
                      <Badge variant="outline" className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                        +{leader.leadershipStyles.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedLeaders.length === 0}
          size="lg"
          className="cta-button px-8"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}