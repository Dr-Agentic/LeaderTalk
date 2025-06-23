import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import CommunicationChart from "@/components/CommunicationChart";
import {
  AnalysisInstance,
  Recording,
  AnalysisResult,
  Leader,
} from "../../../shared/schema";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { getQueryFn, checkSession } from "../lib/queryClient";
import AppLayout from "@/components/AppLayout";


// Type for query data from API
interface RecordingWithAnalysis extends Omit<Recording, "analysisResult"> {
  // This field will be populated from the recording's analysisResult field
  analysis: AnalysisResult | null;
}

export default function TranscriptView() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordingId = parseInt(params.id);
  const { userData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number>(1000);
  const [progress, setProgress] = useState<number>(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check session before loading data
  useEffect(() => {
    const verifySession = async () => {
      try {
        const isLoggedIn = await checkSession();
        if (!isLoggedIn) {
          console.log("Session check failed, redirecting to login");
          navigate("/login");
        }
      } catch (error) {
        console.error("Session verification error:", error);
        setSessionError(
          "Session verification failed. Please try logging in again.",
        );
      }
    };

    verifySession();
  }, [navigate]);

  // Animation effect for progress bar during analysis
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Keep progress under 90% until analysis is complete
        // This visual feedback shows that processing is happening but not complete
        if (prev < 85) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  // Query for recording details including transcription and analysis
  const { data: recording, isLoading: recordingLoading } =
    useQuery<RecordingWithAnalysis>({
      queryKey: ["/api/recordings", recordingId],
      queryFn: async ({ queryKey }) => {
        const [url, id] = queryKey;

        // Check session before making the request
        try {
          const isLoggedIn = await checkSession();
          if (!isLoggedIn) {
            console.error("Session invalid before recording fetch");
            navigate("/login");
            throw new Error("Unauthorized - session invalid");
          }
        } catch (error) {
          console.error("Session check error:", error);
          throw error;
        }

        const response = await fetch(`${url}/${id}`, {
          credentials: "include", // Important! Ensure cookies are sent
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error("Unauthorized response from recording fetch");
            // Try to check session again
            const isLoggedIn = await checkSession();
            if (!isLoggedIn) {
              navigate("/login");
            }
            throw new Error("Unauthorized");
          }
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}`,
          );
        }

        // Get the recording data
        const data = await response.json();

        // Transform the data to match our component needs
        // Map analysisResult to analysis for easier use in our component
        return {
          ...data,
          analysis: data.analysisResult,
        };
      },
      enabled: !isNaN(recordingId) && !sessionError,
    });

  // Fetch all leaders data
  const { data: leaders, isLoading: leadersLoading } = useQuery({
    queryKey: ["/api/leaders"],
    queryFn: async ({ queryKey }) => {
      // Verify session first
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        console.error("Session check failed before leaders fetch");
        navigate("/login");
        throw new Error("Session invalid");
      }

      const response = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized response from leaders fetch");
          navigate("/login");
          throw new Error("Unauthorized");
        }
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      return await response.json();
    },
    enabled: !!userData?.selectedLeaders && !sessionError,
  });

  // Filter leaders to only include those selected by the user
  const selectedLeaders =
    leaders?.filter((leader: Leader) =>
      userData?.selectedLeaders?.includes(leader.id),
    ) || [];

  // Set up polling for analysis results if not available yet
  useEffect(() => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Only poll if we have a recording without analysis
    if (
      recording &&
      (!recording.analysis || Object.keys(recording.analysis).length === 0)
    ) {
      // Create a polling function that refreshes the data
      const pollForAnalysis = () => {
        console.log("Polling for analysis results...");
        queryClient.invalidateQueries({
          queryKey: ["/api/recordings", recordingId],
        });
      };

      // Start polling
      pollingRef.current = setInterval(pollForAnalysis, pollingInterval);

      // Log polling started
      console.log(
        `Started polling for analysis results every ${pollingInterval}ms`,
      );
    } else if (recording && recording.analysis) {
      // If we have analysis results, stop polling and set progress to 100%
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        console.log("Analysis complete, stopped polling");
      }
      setProgress(100);
    }

    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        console.log("Cleaned up polling interval");
      }
    };
  }, [recording, recordingId, pollingInterval, queryClient]);

  const isLoading = recordingLoading || leadersLoading;

  // Handle initial loading state
  if (isLoading) {
    return (
      <AppLayout
        showBackButton
        backTo="/transcripts"
        backLabel="Back to All Transcripts"
      >
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Handle case where recording is not found
  if (!recording) {
    return (
      <AppLayout
        showBackButton
        backTo="/transcripts"
        backLabel="Back to All Transcripts"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 card-title">Recording Not Found</h1>
          <p className="mb-6 card-description">The requested recording could not be found.</p>
        </div>
      </AppLayout>
    );
  }

  // Handle case where recording exists but analysis is in progress
  if (!recording.analysis || Object.keys(recording.analysis).length === 0) {
    return (
      <AppLayout
        showBackButton
        backTo="/dashboard"
        backLabel="Back to Dashboard"
      >
        <Card className="max-w-2xl mx-auto my-8 text-center glass-card">
          <CardHeader>
            <CardTitle className="card-title">Analysis in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />

              <div className="w-full max-w-md">
                <Progress value={progress} className="mb-2" />
                <p className="card-description text-sm">
                  Your recording is being analyzed by our AI. This usually takes
                  less than a minute.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/recording")}
                  className="flex items-center"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start New Recording
                </Button>

                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({
                      queryKey: ["/api/recordings", recordingId],
                    });
                    toast({
                      title: "Refreshing analysis status",
                      description: "Checking for the latest results...",
                    });
                  }}
                  className="flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      showBackButton
      backTo="/transcripts"
      backLabel="Back to All Transcripts"
      pageTitle={`${recording.title} - Transcript`}
    >
      {/* Communication Analysis Chart Section */}
      <Card className="card-layout glass-card">
        <CardHeader className="header-layout">
          <div>
            <CardTitle className="card-title">{recording.title}</CardTitle>
            <p className="card-description">
              Recorded {new Date(recording.recordedAt).toLocaleDateString()} 
              {recording.analysis?.overview?.rating && ` • Overall: ${recording.analysis.overview.rating}`}
            </p>
          </div>
          {recording.analysis?.overview?.rating && (
            <Badge variant="outline" className={`
              status-badge
              ${recording.analysis.overview.rating === "Good" ? "status-positive" : 
                recording.analysis.overview.rating === "Average" ? "status-warning" : 
                "status-negative"}
            `}>
              {recording.analysis.overview.rating} overall
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="content-spacing">
          {/* Communication Analysis Chart */}
          <CommunicationChart data={recording.analysis?.timeline || []} loading={false} />
        </CardContent>
      </Card>

      <Card className="card-layout glass-card">
        <CardHeader>
          <CardTitle className="card-title">Transcript Analysis</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              variant="outline"
              className="bg-green-500/20 text-green-300 border-green-500/30"
            >
              Positive Communication
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-500/20 text-red-300 border-red-500/30"
            >
              Negative Communication
            </Badge>
            <Badge
              variant="outline"
              className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
            >
              Needs Improvement
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="content-spacing">
          {recording.transcription ? (
            <TranscriptWithHighlighting
              transcription={recording.transcription}
              analysis={recording.analysis}
            />
          ) : (
            <p className="card-description italic">
              No transcript available for this recording.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="responsive-grid">
        <Card className="card-layout glass-card">
          <CardHeader>
            <CardTitle className="card-title text-green-400">Positive Moments</CardTitle>
          </CardHeader>
          <CardContent className="content-spacing">
            <AnalysisInstancesList
              instances={recording.analysis?.positiveInstances || []}
              emptyMessage="No positive communication moments identified."
              type="positive"
            />
          </CardContent>
        </Card>

        <Card className="card-layout glass-card">
          <CardHeader>
            <CardTitle className="card-title text-red-400">Negative Moments</CardTitle>
          </CardHeader>
          <CardContent className="content-spacing">
            <AnalysisInstancesList
              instances={recording.analysis?.negativeInstances || []}
              emptyMessage="No negative communication moments identified."
              type="negative"
              selectedLeaders={selectedLeaders}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="card-layout glass-card">
        <CardHeader>
          <CardTitle className="card-title text-yellow-400">Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent className="content-spacing">
          <AnalysisInstancesList
            instances={recording.analysis?.passiveInstances || []}
            emptyMessage="No passive communication moments identified."
            type="passive"
          />
        </CardContent>
      </Card>
      

    </AppLayout>
  );
}

interface TranscriptProps {
  transcription: string;
  analysis: AnalysisResult | null;
}

function TranscriptWithHighlighting({
  transcription,
  analysis,
}: TranscriptProps) {
  console.log("TranscriptWithHighlighting props:", { transcription, analysis });
  // If no analysis, return plain text
  if (!analysis) {
    return <p className="whitespace-pre-line card-description">{transcription}</p>;
  }

  // Extract the instances from the analysis
  const positiveInstances = analysis.positiveInstances || [];
  const negativeInstances = analysis.negativeInstances || [];
  const passiveInstances = analysis.passiveInstances || [];

  // Print out a sample of each instance type for debugging
  if (positiveInstances.length > 0) {
    console.log("Sample positive instance:", positiveInstances[0]);
  }
  if (negativeInstances.length > 0) {
    console.log("Sample negative instance:", negativeInstances[0]);
  }

  // If no transcript or instances, return plain text
  if (
    !transcription ||
    (!positiveInstances.length &&
      !negativeInstances.length &&
      !passiveInstances.length)
  ) {
    return <p className="whitespace-pre-line card-description">{transcription}</p>;
  }
  
  // Function to highlight text using case-insensitive search with lowercase comparison
  const getColoredTranscript = () => {
    // Keep the original transcript and create a lowercase version for matching
    const transcriptOriginal = transcription;
    const transcriptLowercase = transcription.toLowerCase();
    
    // Log a sample of the transcription for debugging
    console.log("Transcription sample:", transcriptOriginal.substring(0, 200));
    
    // Collect all instances that need highlighting and sort by timestamp
    const allInstances = [
      ...positiveInstances.map((i) => ({ ...i, type: "positive" as const })),
      ...negativeInstances.map((i) => ({ ...i, type: "negative" as const })),
      ...passiveInstances.map((i) => ({ ...i, type: "passive" as const })),
    ].sort((a, b) => {
      // Sort by timestamp if available, otherwise keep original order
      return (a.timestamp || 0) - (b.timestamp || 0);
    });

    // Create a mapping array to hold all segments with their positions
    const analysisMapping: {
      start: number;
      end: number;
      type: "positive" | "negative" | "passive";
    }[] = [];

    // Helper function to clean text for searching
    const cleanTextForSearch = (text: string): string => {
      if (!text) return '';
      
      // Convert to lowercase
      let cleanedText = text.toLowerCase().trim();
      
      // If the text is long enough and ends with ellipses, create a version without them
      // This makes our search more flexible with or without ellipses
      if (cleanedText.length > 10 && /[.…]{3,}\s*$/g.test(cleanedText)) {
        // Log original and without ellipses for debugging
        const withoutEllipses = cleanedText.replace(/[.…]{3,}\s*$/g, '').trim();
        console.log("Text has ellipses, searching for both versions:", {
          with: cleanedText.substring(0, 30) + (cleanedText.length > 30 ? "..." : ""),
          without: withoutEllipses.substring(0, 30) + (withoutEllipses.length > 30 ? "..." : "")
        });
        
        // Keep the version with ellipses as they may be part of the text
        return cleanedText;
      }
      
      return cleanedText;
    };
    
    // Find all occurrences of each instance in the transcript
    for (const instance of allInstances) {
      const { text, type, timestamp } = instance;
      if (!text || typeof text !== "string") continue;
      
      // Clean the instance text for searching
      const cleanedText = cleanTextForSearch(text);
      
      // Skip very short segments (likely to cause false positives)
      if (cleanedText.length < 5) continue;
      
      // Debug log to see what we're looking for
      console.log(`Looking for ${type} text:`, {
        original: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        cleaned: cleanedText.substring(0, 50) + (cleanedText.length > 50 ? '...' : ''),
        length: cleanedText.length,
        timestamp
      });
      
      let position = 0;
      let foundCount = 0;
      
      // Search in the lowercase transcript
      while (position < transcriptLowercase.length) {
        const foundIndex = transcriptLowercase.indexOf(cleanedText, position);
        if (foundIndex === -1) {
          if (foundCount === 0) {
            console.log(`*** Text "${cleanedText.substring(0, 50)}${cleanedText.length > 50 ? '...' : ''}" not found in transcript`);
          }
          break; // No more occurrences
        }
        
        foundCount++;
        console.log(`Found ${type} instance at position ${foundIndex} (${transcriptOriginal.substring(foundIndex, foundIndex + 20)}...)`);
        
        // Add the mapping entry with the position in the original transcript
        analysisMapping.push({
          start: foundIndex,
          end: foundIndex + cleanedText.length,
          type,
        });
        
        // Move past this instance to find the next one
        position = foundIndex + cleanedText.length;
      }
    }

    // Sort mapping by starting position
    analysisMapping.sort((a, b) => a.start - b.start);

    // Handle overlapping segments to ensure proper HTML structure
    const resolveOverlaps = (segments: typeof analysisMapping): typeof analysisMapping => {
      if (segments.length <= 1) return segments;
      
      const result: typeof analysisMapping = [segments[0]];
      
      for (let i = 1; i < segments.length; i++) {
        const current = segments[i];
        const previous = result[result.length - 1];
        
        // Check for overlap
        if (current.start < previous.end) {
          // Case 1: Current segment starts inside previous but extends beyond it
          if (current.end > previous.end) {
            // Add a new segment for the non-overlapping part
            result.push({
              start: previous.end,
              end: current.end,
              type: current.type
            });
          }
          // Case 2: Current is fully contained within previous - skip it
        } else {
          // No overlap, add as is
          result.push(current);
        }
      }
      
      return result;
    };
    
    // Resolve any overlapping segments
    const resolvedMapping = resolveOverlaps(analysisMapping);
    
    // Build the final HTML by inserting spans at the appropriate positions
    // We'll insert from end to start to avoid position shifts
    const segmentsReversed = [...resolvedMapping].reverse();
    
    // Start with the original transcript
    let result = transcriptOriginal;
    
    for (const segment of segmentsReversed) {
      // Get the text to highlight from the original transcript
      const originalText = transcriptOriginal.substring(segment.start, segment.end);
      
      // Create the highlighted span based on type
      let cssClass = "";
      if (segment.type === "positive") {
        cssClass = "highlight-positive";
      } else if (segment.type === "negative") {
        cssClass = "highlight-negative";
      } else if (segment.type === "passive") {
        cssClass = "highlight-passive";
      }
      
      // Replace the text with the highlighted version
      const highlightedText = `<span class="${cssClass}">${originalText}</span>`;
      
      // Insert the highlighted text at the correct position
      result = 
        result.substring(0, segment.start) + 
        highlightedText + 
        result.substring(segment.end);
    }
    
    return result;
  };

  // Get the highlighted transcript
  const highlightedTranscript = getColoredTranscript();

  return (
    <div className="max-w-none whitespace-pre-line card-description">
      <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
    </div>
  );
}

interface AnalysisInstancesListProps {
  instances: AnalysisInstance[];
  emptyMessage: string;
  type: "positive" | "negative" | "passive";
  selectedLeaders?: any[]; // Type will be improved
}

function AnalysisInstancesList({
  instances,
  emptyMessage,
  type,
  selectedLeaders = [],
}: AnalysisInstancesListProps) {
  const [activeInstance, setActiveInstance] = useState<number | null>(null);
  const [activeLeader, setActiveLeader] = useState<number | null>(null);
  const [leaderAlternatives, setLeaderAlternatives] = useState<{
    [key: string]: string;
  }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Function to fetch the leader's alternative text from the API
  const fetchLeaderAlternative = async (
    instance: AnalysisInstance,
    leaderId: number,
  ) => {
    const cacheKey = `${leaderId}:${instance.text}`;

    // If we already have this alternative or are loading it, don't fetch again
    if (leaderAlternatives[cacheKey] || loading[cacheKey]) {
      return;
    }

    try {
      // Mark this combination as loading
      setLoading((prev) => ({ ...prev, [cacheKey]: true }));

      // Check session before API call
      const isLoggedIn = await checkSession();
      if (!isLoggedIn) {
        throw new Error("Session expired - please login again");
      }

      // Make the API request using the correct endpoint
      const response = await fetch(`/api/leaders/${leaderId}/alternatives?text=${encodeURIComponent(instance.text)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important to include cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch alternative: ${response.statusText}`);
      }

      const data = await response.json();

      // Save the alternative text (response structure from /api/leaders/:id/alternatives)
      setLeaderAlternatives((prev) => ({
        ...prev,
        [cacheKey]: data.alternativeText,
      }));
    } catch (error) {
      console.error("Error fetching leader alternative:", error);
      toast({
        title: "Error",
        description: `Could not load alternative text: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      // Mark as no longer loading
      setLoading((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  // Function to get the alternative text (either cached or placeholder)
  const getLeaderAlternative = (
    instance: AnalysisInstance,
    leaderId: number,
  ) => {
    const cacheKey = `${leaderId}:${instance.text}`;

    // If we have the alternative text cached, return it
    if (leaderAlternatives[cacheKey]) {
      return leaderAlternatives[cacheKey];
    }

    // Otherwise, load it and return a placeholder
    fetchLeaderAlternative(instance, leaderId);
    return loading[cacheKey]
      ? "Loading alternative response..."
      : "Click to load alternative response";
  };

  if (!instances.length) {
    return <p className="card-description italic">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {instances.map((instance, index) => (
        <div key={index} className="pb-3">
          <p className="font-medium mb-1">
            <span
              className={`${
                type === "positive"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : type === "negative"
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              } px-1 py-0.5 rounded`}
            >
              "{instance.text}"
            </span>
            <span className="text-xs card-description ml-2">
              {formatTimestamp(instance.timestamp)}
            </span>
          </p>
          <p className="text-sm card-description ml-2">{instance.analysis}</p>
          {instance.improvement && (
            <p className="text-sm text-blue-400 ml-2 mt-1">
              <strong>Suggestion:</strong> {instance.improvement}
            </p>
          )}

          {/* Show leader suggestions for negative moments */}
          {type === "negative" &&
            selectedLeaders &&
            selectedLeaders.length > 0 && (
              <div className="mt-3 ml-2">
                <p className="text-xs card-description mb-2">
                  How would your selected leaders express this?
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedLeaders.map((leader) => (
                    <Button
                      key={leader.id}
                      size="sm"
                      variant={
                        activeLeader === leader.id && activeInstance === index
                          ? "default"
                          : "outline"
                      }
                      className="flex items-center gap-1"
                      onClick={() => {
                        if (
                          activeLeader === leader.id &&
                          activeInstance === index
                        ) {
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
                  <div className="mt-3 bg-blue-500/20 border border-blue-500/30 p-3 rounded-md backdrop-blur-sm">
                    <p className="text-xs text-blue-300 mb-2">
                      {selectedLeaders.find((l) => l.id === activeLeader)?.name}
                      's Approach:
                    </p>
                    <p className="text-sm whitespace-pre-line text-blue-200">
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
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
