import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderSelection({ leaders, onComplete }) {
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const toggleLeaderSelection = (leaderId: number) => {
    setSelectedLeaders(prev => {
      if (prev.includes(leaderId)) {
        return prev.filter(id => id !== leaderId);
      } else {
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
  
  if (!leaders || leaders.length === 0) {
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
        <h2 className="text-2xl font-bold text-gray-900">Choose Leaders That Inspire You</h2>
        <p className="text-gray-600 mt-1">We'll analyze your communication based on their style</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {leaders.map(leader => (
          <div 
            key={leader.id}
            className={`bg-white overflow-hidden rounded-lg border ${
              selectedLeaders.includes(leader.id)
                ? "border-primary border-2"
                : "border-gray-200"
            } hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => toggleLeaderSelection(leader.id)}
          >
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
              
              <h3 className="font-semibold text-lg text-gray-900">{leader.name}</h3>
              <p className="text-sm text-gray-500">{leader.title}</p>
              
              <div className="mt-3 flex gap-2 flex-wrap">
                {leader.traits && leader.traits.map((trait, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {trait}
                  </Badge>
                ))}
              </div>
              
              <p className="mt-3 text-sm text-gray-600">{leader.description}</p>
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
          {isSubmitting ? "Saving..." : "Continue to Dashboard"}
        </Button>
      </div>
    </div>
  );
}
