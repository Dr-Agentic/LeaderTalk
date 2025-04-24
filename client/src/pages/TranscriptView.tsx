import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnalysisInstance, Recording, AnalysisResult } from "../../../shared/schema";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { getQueryFn, checkSession } from "../lib/queryClient";

// Type for query data from API
interface RecordingWithAnalysis extends Omit<Recording, 'analysisResult'> {
  // This field will be populated from the recording's analysisResult field
  analysis: AnalysisResult | null;
}

export default function TranscriptView() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordingId = parseInt(params.id);
  const { userData } = useAuth();
  
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Check session before loading data
  useEffect(() => {
    const verifySession = async () => {
      try {
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
          console.log("Session check failed, redirecting to login");
          navigate('/login');
        }
      } catch (error) {
        console.error("Session verification error:", error);
        setSessionError("Session verification failed. Please try logging in again.");
      }
    };
    
    verifySession();
  }, [navigate]);
  
  // Query for recording details including transcription and analysis
  const { data: recording, isLoading: recordingLoading } = useQuery<RecordingWithAnalysis>({
    queryKey: ['/api/recordings', recordingId],
    queryFn: async ({ queryKey }) => {
      const [url, id] = queryKey;
      
      // Check session before making the request
      try {
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
          console.error("Session invalid before recording fetch");
          navigate('/login');
          throw new Error("Unauthorized - session invalid");
        }
      } catch (error) {
        console.error("Session check error:", error);
        throw error;
      }
      
      const response = await fetch(`${url}/${id}`, {
        credentials: 'include', // Important! Ensure cookies are sent
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized response from recording fetch");
          // Try to check session again
          const isLoggedIn = await checkSession();
          if (!isLoggedIn) {
            navigate('/login');
          }
          throw new Error("Unauthorized");
        }
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }
      
      // Get the recording data
      const data = await response.json();
      
      // Transform the data to match our component needs
      // Map analysisResult to analysis for easier use in our component
      return {
        ...data,
        analysis: data.analysisResult
      };
    },
    enabled: !isNaN(recordingId) && !sessionError,
  });
  
  // Fetch all leaders data
  const { data: leaders, isLoading: leadersLoading } = useQuery({
    queryKey: ['/api/leaders'],
    queryFn: async ({ queryKey }) => {
      // Verify session first
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        console.error("Session check failed before leaders fetch");
        navigate('/login');
        throw new Error("Session invalid");
      }
      
      const response = await fetch(queryKey[0] as string, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized response from leaders fetch");
          navigate('/login');
          throw new Error("Unauthorized");
        }
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      return await response.json();
    },
    enabled: !!userData?.selectedLeaders && !sessionError,
  });
  
  // Filter leaders to only include those selected by the user
  const selectedLeaders = leaders?.filter(
    leader => userData?.selectedLeaders?.includes(leader.id)
  ) || [];
  
  const isLoading = recordingLoading || leadersLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!recording) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Recording Not Found</h1>
          <p className="mb-6">The requested recording could not be found.</p>
          <BackButton to="/transcripts" label="Back to All Transcripts" className="mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <BackButton 
          to="/transcripts" 
          label="Back to All Transcripts" 
          className="mr-2"
        />
        <h1 className="text-2xl font-bold">{recording.title} - Transcript</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Transcript Analysis</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Positive Communication
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Negative Communication
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Needs Improvement
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recording.transcription ? (
            <TranscriptWithHighlighting
              transcription={recording.transcription}
              analysis={recording.analysis}
            />
          ) : (
            <p className="text-gray-500 italic">No transcript available for this recording.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Positive Moments</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisInstancesList
              instances={recording.analysis?.positiveInstances || []}
              emptyMessage="No positive communication moments identified."
              type="positive"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Negative Moments</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisInstancesList
              instances={recording.analysis?.negativeInstances || []}
              emptyMessage="No negative communication moments identified."
              type="negative"
              selectedLeaders={selectedLeaders}
            />
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-gray-600">Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisInstancesList
            instances={recording.analysis?.passiveInstances || []}
            emptyMessage="No passive communication moments identified."
            type="passive"
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface TranscriptProps {
  transcription: string;
  analysis: AnalysisResult | null;
}

function TranscriptWithHighlighting({ transcription, analysis }: TranscriptProps) {
  // If no analysis, return plain text
  if (!analysis) {
    return <p className="whitespace-pre-line">{transcription}</p>;
  }
  
  // Extract the instances from the analysis
  const positiveInstances = analysis.positiveInstances || [];
  const negativeInstances = analysis.negativeInstances || [];
  const passiveInstances = analysis.passiveInstances || [];
  
  // If no transcript or instances, return plain text
  if (!transcription || (!positiveInstances.length && !negativeInstances.length && !passiveInstances.length)) {
    return <p className="whitespace-pre-line">{transcription}</p>;
  }
  
  // Function to highlight text
  const getColoredTranscript = () => {
    let result = transcription;
    
    // First, we need to sort all instances by the length of their text (longest first)
    // This prevents shorter matches from breaking longer ones
    const allInstances = [
      ...positiveInstances.map((i) => ({ ...i, type: 'positive' as const })),
      ...negativeInstances.map((i) => ({ ...i, type: 'negative' as const })),
      ...passiveInstances.map((i) => ({ ...i, type: 'passive' as const }))
    ].sort((a, b) => b.text.length - a.text.length);
    
    // Map of instance text to type
    const instanceMap = new Map();
    allInstances.forEach(instance => {
      instanceMap.set(instance.text, instance.type);
    });
    
    // Create HTML with spans for highlighting
    for (const instance of allInstances) {
      const { text, type } = instance;
      if (!text || typeof text !== 'string') continue;
      
      // Escape regex special characters
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create CSS class based on type
      let cssClass = '';
      if (type === 'positive') {
        cssClass = 'bg-green-100 text-green-800 px-1 rounded';
      } else if (type === 'negative') {
        cssClass = 'bg-red-100 text-red-800 px-1 rounded';
      } else if (type === 'passive') {
        cssClass = 'bg-gray-100 text-gray-800 px-1 rounded';
      }
      
      // Replace text with highlighted version
      const regex = new RegExp(escapedText, 'g');
      result = result.replace(regex, `<span class="${cssClass}">${text}</span>`);
    }
    
    return result;
  };
  
  // Get the highlighted transcript
  const highlightedTranscript = getColoredTranscript();
  
  return (
    <div className="prose prose-sm max-w-none whitespace-pre-line">
      <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
    </div>
  );
}

interface AnalysisInstancesListProps {
  instances: AnalysisInstance[];
  emptyMessage: string;
  type: 'positive' | 'negative' | 'passive';
  selectedLeaders?: any[]; // Type will be improved
}

function AnalysisInstancesList({ 
  instances, 
  emptyMessage, 
  type,
  selectedLeaders = []
}: AnalysisInstancesListProps) {
  const [activeInstance, setActiveInstance] = useState<number | null>(null);
  const [activeLeader, setActiveLeader] = useState<number | null>(null);
  const [leaderAlternatives, setLeaderAlternatives] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  
  // Function to fetch the leader's alternative text from the API
  const fetchLeaderAlternative = async (instance: AnalysisInstance, leaderId: number) => {
    const cacheKey = `${leaderId}:${instance.text}`;
    
    // If we already have this alternative or are loading it, don't fetch again
    if (leaderAlternatives[cacheKey] || loading[cacheKey]) {
      return;
    }
    
    try {
      // Mark this combination as loading
      setLoading(prev => ({ ...prev, [cacheKey]: true }));
      
      // Check session before API call
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        throw new Error("Session expired - please login again");
      }
      
      // Make the API request
      const response = await fetch('/api/leader-alternative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important to include cookies
        body: JSON.stringify({
          leaderId,
          originalText: instance.text
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alternative: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Save the alternative text
      setLeaderAlternatives(prev => ({ 
        ...prev, 
        [cacheKey]: data.alternative.alternativeText 
      }));
    } catch (error) {
      console.error('Error fetching leader alternative:', error);
      toast({
        title: "Error",
        description: `Could not load alternative text: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      // Mark as no longer loading
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  };
  
  // Function to get the alternative text (either cached or placeholder)
  const getLeaderAlternative = (instance: AnalysisInstance, leaderId: number) => {
    const cacheKey = `${leaderId}:${instance.text}`;
    
    // If we have the alternative text cached, return it
    if (leaderAlternatives[cacheKey]) {
      return leaderAlternatives[cacheKey];
    }
    
    // Otherwise, load it and return a placeholder
    fetchLeaderAlternative(instance, leaderId);
    return loading[cacheKey] ? "Loading alternative response..." : "Click to load alternative response";
  };
  
  if (!instances.length) {
    return <p className="text-gray-500 italic">{emptyMessage}</p>;
  }
  
  return (
    <div className="space-y-4">
      {instances.map((instance, index) => (
        <div key={index} className="pb-3">
          <p className="font-medium mb-1">
            <span
              className={`${
                type === 'positive'
                  ? 'bg-green-100 text-green-800'
                  : type === 'negative'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              } px-1 py-0.5 rounded`}
            >
              "{instance.text}"
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {formatTimestamp(instance.timestamp)}
            </span>
          </p>
          <p className="text-sm text-gray-700 ml-2">{instance.analysis}</p>
          {instance.improvement && (
            <p className="text-sm text-blue-600 ml-2 mt-1">
              <strong>Suggestion:</strong> {instance.improvement}
            </p>
          )}
          
          {/* Show leader suggestions for negative moments */}
          {type === 'negative' && selectedLeaders && selectedLeaders.length > 0 && (
            <div className="mt-3 ml-2">
              <p className="text-xs text-gray-500 mb-2">
                How would your selected leaders express this?
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedLeaders.map(leader => (
                  <Button
                    key={leader.id}
                    size="sm"
                    variant={activeLeader === leader.id && activeInstance === index ? "default" : "outline"}
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (activeLeader === leader.id && activeInstance === index) {
                        setActiveLeader(null);
                        setActiveInstance(null);
                      } else {
                        setActiveLeader(leader.id);
                        setActiveInstance(index);
                      }
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {leader.name}
                  </Button>
                ))}
              </div>
              
              {/* Display the selected leader's suggestion */}
              {activeLeader && activeInstance === index && (
                <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-md">
                  <p className="text-xs text-blue-700 mb-2">
                    {selectedLeaders.find(l => l.id === activeLeader)?.name}'s Approach:
                  </p>
                  <p className="text-sm whitespace-pre-line text-blue-900">
                    {getLeaderAlternative(instance, activeLeader)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {index < instances.length - 1 && <Separator className="mt-3" />}
        </div>
      ))}
    </div>
  );
}

// Utility function to format timestamp in mm:ss format
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}