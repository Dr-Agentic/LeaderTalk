import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, Mic, MicOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackButton } from "../components/BackButton";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useRecording } from "../hooks/useRecording";
import { getQueryFn, apiRequest } from "../lib/queryClient";

interface StyleResponse {
  empathetic: string;
  inspirational: string;
  commanding: string;
}

interface Situation {
  id: number;
  moduleId: number;
  description: string;
  userPrompt: string;
  styleResponses: StyleResponse;
  order: number;
  createdAt: string;
  userProgress: UserProgress | null;
}

interface UserProgress {
  id: number;
  userId: number;
  situationId: number;
  response: string;
  score: number;
  feedback: string;
  passed: boolean;
  completedAt: string | null;
  createdAt: string;
}

interface SubmitResponseParams {
  situationId: number;
  response: string;
  leadershipStyle: string;
}

interface AttemptEvaluation {
  styleMatchScore: number;
  clarity: number;
  empathy: number;
  persuasiveness: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
}

interface Attempt {
  id: number;
  userId: number;
  situationId: number;
  response: string;
  leadershipStyle: string;
  score: number;
  feedback: string;
  evaluation: AttemptEvaluation;
  createdAt: string;
}

export default function SituationView() {
  // Support both URL patterns: legacy /training/situation/:id and new /training/chapter/:chapterId/module/:moduleId/situation/:id
  const [matchesLegacy, legacyParams] = useRoute<{ id: string }>("/training/situation/:id");
  const [matchesNew, newParams] = useRoute<{ chapterId: string, moduleId: string, id: string }>("/training/chapter/:chapterId/module/:moduleId/situation/:id");
  
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Determine which route pattern matched and extract parameters
  const [situationId, setFunctionId] = useState<number>(0);
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [chapterId, setChapterId] = useState<number | null>(null);
  
  // Update IDs when route changes
  useEffect(() => {
    if (matchesNew && newParams) {
      setFunctionId(parseInt(newParams.id));
      setModuleId(parseInt(newParams.moduleId));
      setChapterId(parseInt(newParams.chapterId));
    } else if (matchesLegacy && legacyParams) {
      setFunctionId(parseInt(legacyParams.id));
      // Check for moduleId in query params for legacy route
      const moduleIdParam = searchParams.get('moduleId');
      setModuleId(moduleIdParam ? parseInt(moduleIdParam) : null);
      setChapterId(null);
    }
  }, [matchesNew, newParams, matchesLegacy, legacyParams, searchParams]);
  
  const { isAuthenticated, isLoading: authLoading, userData } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [response, setResponse] = useState("");
  const [leadershipStyle, setLeadershipStyle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExampleResponses, setShowExampleResponses] = useState(false);
  
  // Recording functionality for voice responses
  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    recordingBlob, 
    recordingDuration,
    resetRecording
  } = useRecording();

  const preferredStyle = userData?.preferredLeadershipStyle || "";
  
  useEffect(() => {
    if (preferredStyle && !leadershipStyle) {
      setLeadershipStyle(preferredStyle);
    }
  }, [preferredStyle, leadershipStyle]);

  // Fetch the situation directly from JSON files
  const { data: situation, isLoading: isSituationLoading, isError: isSituationError } = useQuery({
    queryKey: [`/api/training/situations-direct/${situationId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!situationId && isAuthenticated,
    onSuccess: (data) => {
      // Handle redirection if the ID belongs to a module
      if (data && data.redirect) {
        console.log(`Redirecting to: ${data.redirectUrl}`);
        navigate(data.redirectUrl);
      }
    },
    onError: (error: any) => {
      // Check if the error contains a redirection message (302 response)
      try {
        const errorData = JSON.parse(error.message.split(': ')[1]);
        if (errorData.redirect && errorData.redirectUrl) {
          console.log(`Error with redirect data: ${errorData.message}`);
          navigate(errorData.redirectUrl);
        }
      } catch (e) {
        console.error("Failed to parse error data:", e);
      }
    }
  });
  
  // Fetch attempts for this situation
  const { data: attemptsData, isLoading: isAttemptsLoading, isError: isAttemptsError } = useQuery({
    queryKey: [`/api/training/situations/${situationId}/attempts`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!situationId && isAuthenticated,
    // Handle error gracefully
    onError: (error) => {
      console.log('Error fetching attempts, returning empty array', error);
    },
    // Provide default data if table doesn't exist yet or other errors
    placeholderData: { attempts: [] }
  });

  // Mutation for submitting a response
  const submitResponse = useMutation({
    mutationFn: async ({ situationId, response, leadershipStyle }: SubmitResponseParams) => {
      return apiRequest(`/api/training/situations/${situationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, leadershipStyle, fromJsonFile: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training/situations/${situationId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/training/situations/${situationId}/attempts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training/next-situation"] });
      
      toast({
        title: "Response submitted",
        description: "Your response has been evaluated.",
      });
      
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error submitting response:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "There was an error submitting your response. Please try again.",
      });
      setIsSubmitting(false);
    },
  });

  // Handle the audio recording when it's completed
  useEffect(() => {
    if (recordingBlob) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          // Convert audio to text using server API (simplified for now)
          try {
            // For simplicity, we're just using the recorded audio duration as a mock
            // In a real implementation, you would send the audio to a speech-to-text service
            const mockTranscription = `This is a simulated transcription of ${recordingDuration.toFixed(1)} seconds of audio.`;
            setResponse(mockTranscription);
          } catch (error) {
            console.error("Error transcribing audio:", error);
            toast({
              variant: "destructive",
              title: "Transcription failed",
              description: "There was an error processing your recording.",
            });
          }
        }
      };
      reader.readAsDataURL(recordingBlob);
    }
  }, [recordingBlob, recordingDuration, toast]);

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = () => {
    if (!response.trim()) {
      toast({
        variant: "destructive",
        title: "Response required",
        description: "Please provide a response before submitting.",
      });
      return;
    }

    if (!leadershipStyle) {
      toast({
        variant: "destructive",
        title: "Leadership style required",
        description: "Please select a leadership style for your response.",
      });
      return;
    }

    setIsSubmitting(true);
    submitResponse.mutate({ situationId, response, leadershipStyle });
  };

  const toggleExampleResponses = () => {
    setShowExampleResponses(!showExampleResponses);
  };

  // Handling loading states
  const isLoading = authLoading || isSituationLoading || isAttemptsLoading;

  if (isLoading) {
    return <SituationViewSkeleton />;
  }

  if (!situation) {
    return (
      <div className="container mx-auto px-4 py-8">
        {chapterId && moduleId ? (
          <BackButton 
            to={`/training/chapter/${chapterId}/module/${moduleId}`} 
            label="Back to Module" 
          />
        ) : moduleId ? (
          <BackButton 
            to={`/training/module/${moduleId}`} 
            label="Back to Module" 
          />
        ) : (
          <BackButton 
            to="/training" 
            label="Back to Training" 
          />
        )}
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Situation not found</AlertTitle>
          <AlertDescription>
            The situation you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton 
        to={moduleId ? `/training/module/${moduleId}` : "/training"} 
        label={moduleId ? "Back to Module" : "Back to Training"} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leadership Situation</CardTitle>
            <CardDescription>
              Respond to this scenario using your preferred leadership style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium text-lg mb-2">Scenario:</p>
              <p>{situation.description}</p>
            </div>

            <div>
              <p className="font-medium text-lg mb-2">Your Response:</p>
              {situation.userProgress ? (
                <div className="p-4 border rounded-md">
                  <p>{situation.userProgress.response}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your response here..."
                    className="min-h-32"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    disabled={isSubmitting}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSubmitting}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" /> Stop Recording ({recordingDuration.toFixed(1)}s)
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" /> Record Response
                        </>
                      )}
                    </Button>
                    
                    {recordingBlob && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetRecording}
                        disabled={isSubmitting || isRecording}
                      >
                        Clear Recording
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="font-medium text-lg mb-2">Leadership Style:</p>
              {situation.userProgress ? (
                <div className="p-4 border rounded-md capitalize">
                  {situation.userProgress.leadershipStyle || "Not specified"}
                </div>
              ) : (
                <RadioGroup
                  value={leadershipStyle}
                  onValueChange={setLeadershipStyle}
                  className="flex flex-col space-y-2"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="empathetic" id="empathetic" />
                    <Label htmlFor="empathetic" className="font-medium">Empathetic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inspirational" id="inspirational" />
                    <Label htmlFor="inspirational" className="font-medium">Inspirational</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="commanding" id="commanding" />
                    <Label htmlFor="commanding" className="font-medium">Commanding</Label>
                  </div>
                </RadioGroup>
              )}
            </div>
            
            {!situation.userProgress && (
              <CardFooter className="px-0">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Response"}
                </Button>
              </CardFooter>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {situation.userProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {situation.userProgress.passed ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  Feedback
                </CardTitle>
                <CardDescription>
                  Score: {situation.userProgress.score}/100
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{situation.userProgress.feedback}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (chapterId && moduleId) {
                      navigate(`/training/chapter/${chapterId}/next-situation`);
                    } else if (moduleId) {
                      navigate(`/training/next-situation?moduleId=${moduleId}`);
                    } else {
                      navigate(`/training/next-situation`);
                    }
                  }}
                >
                  Continue to Next Exercise
                </Button>
              </CardFooter>
            </Card>
          )}

          {situation.userProgress && attemptsData?.attempts?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Attempts</CardTitle>
                <CardDescription>
                  Your history of attempts for this situation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attemptsData.attempts.slice(0, 3).map((attempt: any) => (
                  <div key={attempt.id || Math.random()} className="border rounded-md p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{attempt.leadershipStyle || 'Unknown'} Style</span>
                        <span className="text-sm text-muted-foreground">
                          {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : 'Unknown date'}
                        </span>
                      </div>
                      <span className="font-semibold">Score: {attempt.score || 0}/100</span>
                    </div>
                    
                    <div className="text-sm">
                      <p className="line-clamp-2">{attempt.response || 'No response text available'}</p>
                    </div>

                    {attempt.evaluation ? (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Style</span>
                          <span className="font-semibold">{attempt.evaluation.styleMatchScore || 0}%</span>
                        </div>
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Clarity</span>
                          <span className="font-semibold">{attempt.evaluation.clarity || 0}%</span>
                        </div>
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Empathy</span>
                          <span className="font-semibold">{attempt.evaluation.empathy || 0}%</span>
                        </div>
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Persuasion</span>
                          <span className="font-semibold">{attempt.evaluation.persuasiveness || 0}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Detailed evaluation data not available for this attempt
                      </div>
                    )}
                  </div>
                ))}
                
                {attemptsData.attempts.length > 3 && (
                  <div className="text-center">
                    <Button variant="link" size="sm">
                      View all {attemptsData.attempts.length} attempts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Example Responses</CardTitle>
              <CardDescription>
                See how different leadership styles would approach this situation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={toggleExampleResponses}
                className="w-full mb-4"
              >
                {showExampleResponses ? "Hide Examples" : "Show Examples"}
              </Button>

              {showExampleResponses && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Empathetic Style</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {situation.styleResponses.empathetic}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Inspirational Style</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {situation.styleResponses.inspirational}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Commanding Style</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {situation.styleResponses.commanding}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SituationViewSkeleton() {
  // For skeleton we'll just show a back button to training since parameters may not be ready
  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton 
        to="/training"
        label="Back to Training"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 border rounded-lg p-6 animate-pulse">
          <div className="h-7 w-52 bg-muted rounded mb-2"></div>
          <div className="h-5 w-72 bg-muted rounded mb-8"></div>
          
          <div className="bg-muted p-4 rounded-md mb-6">
            <div className="h-6 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="mb-6">
            <div className="h-6 w-36 bg-muted rounded mb-2"></div>
            <div className="h-32 w-full bg-muted rounded mb-2"></div>
            <div className="flex gap-2">
              <div className="h-8 w-32 bg-muted rounded"></div>
              <div className="h-8 w-32 bg-muted rounded"></div>
            </div>
          </div>

          <div>
            <div className="h-6 w-40 bg-muted rounded mb-2"></div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-6 w-32 bg-muted rounded"></div>
              <div className="h-6 w-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 animate-pulse">
            <div className="h-7 w-40 bg-muted rounded mb-2"></div>
            <div className="h-5 w-60 bg-muted rounded mb-6"></div>
            <div className="h-24 w-full bg-muted rounded mb-4"></div>
          </div>
          
          {/* Previous attempts skeleton */}
          <div className="border rounded-lg p-6 animate-pulse">
            <div className="h-7 w-48 bg-muted rounded mb-2"></div>
            <div className="h-5 w-64 bg-muted rounded mb-6"></div>
            
            <div className="space-y-4">
              {/* Attempt 1 */}
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-40 bg-muted rounded"></div>
                  <div className="h-5 w-24 bg-muted rounded"></div>
                </div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
              
              {/* Attempt 2 */}
              <div className="border rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-40 bg-muted rounded"></div>
                  <div className="h-5 w-24 bg-muted rounded"></div>
                </div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Example responses skeleton */}
          <div className="border rounded-lg p-6 animate-pulse">
            <div className="h-7 w-40 bg-muted rounded mb-2"></div>
            <div className="h-5 w-60 bg-muted rounded mb-6"></div>
            <div className="h-10 w-full bg-muted rounded mb-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}