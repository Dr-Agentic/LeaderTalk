import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, Mic, MicOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useRecording } from "../hooks/useRecording";
import { getQueryFn, apiRequest } from "../lib/queryClient";
import AppLayout from "@/components/AppLayout";
import SubmissionFlow from "@/components/SubmissionFlow";

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
  const [matchesLegacy, legacyParams] = useRoute<{ id: string }>(
    "/training/situation/:id",
  );
  const [matchesNew, newParams] = useRoute<{
    chapterId: string;
    moduleId: string;
    id: string;
  }>("/training/chapter/:chapterId/module/:moduleId/situation/:id");

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
      const moduleIdParam = searchParams.get("moduleId");
      setModuleId(moduleIdParam ? parseInt(moduleIdParam) : null);

      // Look for chapter ID in query params too
      const chapterIdParam = searchParams.get("fromChapter");
      setChapterId(chapterIdParam ? parseInt(chapterIdParam) : null);
    }
  }, [matchesNew, newParams, matchesLegacy, legacyParams, searchParams]);

  const { isAuthenticated, isLoading: authLoading, userData } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [response, setResponse] = useState("");
  const [leadershipStyle, setLeadershipStyle] = useState("");
  const [assignedLeadershipStyle, setAssignedLeadershipStyle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExampleResponses, setShowExampleResponses] = useState(false);
  
  // New submission flow states
  const [submissionPhase, setSubmissionPhase] = useState<'idle' | 'submitted' | 'analyzing' | 'complete'>('idle');
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [submittedResponse, setSubmittedResponse] = useState("");

  // Recording functionality for voice responses
  const {
    isRecording,
    startRecording,
    stopRecording,
    recordingBlob,
    recordingDuration,
    resetRecording,
  } = useRecording();

  const preferredStyle = userData?.preferredLeadershipStyle || "";

  // Define leadership styles
  const leadershipStyles = ["empathetic", "inspirational", "commanding"];

  // Fetch the situation directly from JSON files
  const {
    data: situation,
    isLoading: isSituationLoading,
    isError: isSituationError,
  } = useQuery({
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
        const errorData = JSON.parse(error.message.split(": ")[1]);
        if (errorData.redirect && errorData.redirectUrl) {
          console.log(`Error with redirect data: ${errorData.message}`);
          navigate(errorData.redirectUrl);
        }
      } catch (e) {
        console.error("Failed to parse error data:", e);
      }
    },
  });

  // Fetch attempts for this situation
  const {
    data: attemptsData,
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
  } = useQuery({
    queryKey: [`/api/training/situations/${situationId}/attempts`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!situationId && isAuthenticated,
    // Handle error gracefully
    onError: (error) => {
      console.log("Error fetching attempts, returning empty array", error);
    },
    // Provide default data if table doesn't exist yet or other errors
    placeholderData: { attempts: [] },
  });

  // New AI-powered submission mutation
  const submitResponse = useMutation({
    mutationFn: async ({
      situationId,
      response,
      leadershipStyle,
    }: SubmitResponseParams) => {
      setSubmissionPhase('analyzing');
      setSubmittedResponse(response);
      
      return apiRequest(
        "POST",
        `/api/training/submit-with-ai-evaluation`,
        { 
          scenarioId: situationId, 
          userResponse: response,
          leadershipStyle 
        },
      );
    },
    onSuccess: (data) => {
      console.log("AI evaluation response:", data);
      // Store AI evaluation and complete the flow
      setAiEvaluation(data.evaluation);
      setSubmissionPhase('complete');
      
      queryClient.invalidateQueries({
        queryKey: [`/api/training/situations/${situationId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/training/situations/${situationId}/attempts`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/training/progress"] });

      toast({
        title: "AI Analysis Complete",
        description: "Your response has been evaluated with detailed feedback.",
      });

      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error submitting response:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "There was an error analyzing your response. Please try again.",
      });
      setIsSubmitting(false);
      setSubmissionPhase('idle');
    },
  });

  // Randomly assign a leadership style when situation loads
  useEffect(() => {
    if (situation && !assignedLeadershipStyle) {
      // Use situation ID as seed for consistent random assignment per situation
      const randomIndex = situation.id % leadershipStyles.length;
      const assignedStyle = leadershipStyles[randomIndex];
      setAssignedLeadershipStyle(assignedStyle);
      setLeadershipStyle(assignedStyle);
    }
  }, [situation, assignedLeadershipStyle]);

  useEffect(() => {
    if (preferredStyle && !leadershipStyle && !assignedLeadershipStyle) {
      setLeadershipStyle(preferredStyle);
    }
  }, [preferredStyle, leadershipStyle, assignedLeadershipStyle]);

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
    // Determine the appropriate back navigation path
    const backTo =
      chapterId && moduleId
        ? `/training/chapter/${chapterId}/module/${moduleId}`
        : moduleId
          ? `/training/module/${moduleId}`
          : "/training";

    const backLabel = moduleId ? "Back to Module" : "Back to Training";

    return (
      <AppLayout
        showBackButton
        backTo={backTo}
        backLabel={backLabel}
        pageTitle="Situation"
      >
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Situation not found</AlertTitle>
          <AlertDescription>
            The situation you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  // Determine the appropriate back navigation path
  const backTo =
    chapterId && moduleId
      ? `/training/chapter/${chapterId}/module/${moduleId}`
      : moduleId
        ? `/training/module/${moduleId}`
        : "/training";

  const backLabel = moduleId ? "Back to Module" : "Back to Training";

  return (
    <AppLayout
      showBackButton
      backTo={backTo}
      backLabel={backLabel}
      pageTitle={
        situation.userProgress ? "Response Review" : "Training Situation"
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            {assignedLeadershipStyle && (
              <div className="bg-accent border border-accent-foreground/20 p-4 rounded-md">
                <p className="font-medium text-lg mb-2">
                  🎯 Required Leadership Style:
                </p>
                <p className="text-xl font-semibold capitalize text-accent-foreground">
                  {assignedLeadershipStyle}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Respond to this situation using a {assignedLeadershipStyle}{" "}
                  leadership approach.
                </p>
              </div>
            )}

            <div className="bg-primary-foreground border border-primary/20 p-4 rounded-md">
              <p className="font-medium text-lg mb-2">Your Task:</p>
              <p>{situation.userPrompt}</p>
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


                </div>
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
          {(situation.userProgress || (submissionPhase === 'complete' && aiEvaluation)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {(situation.userProgress?.passed || (aiEvaluation && aiEvaluation.styleMatchScore >= 70)) ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Score: {situation.userProgress?.score || aiEvaluation?.styleMatchScore || 0}/100
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiEvaluation && submissionPhase === 'complete' ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Overall Feedback</h4>
                      <p className="text-sm">{aiEvaluation.improvement}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center p-3 bg-muted rounded">
                        <span className="text-xs text-muted-foreground">Style Match</span>
                        <span className="font-semibold text-lg">{aiEvaluation.styleMatchScore || 0}%</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted rounded">
                        <span className="text-xs text-muted-foreground">Clarity</span>
                        <span className="font-semibold text-lg">{aiEvaluation.clarity || 0}%</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted rounded">
                        <span className="text-xs text-muted-foreground">Empathy</span>
                        <span className="font-semibold text-lg">{aiEvaluation.empathy || 0}%</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-muted rounded">
                        <span className="text-xs text-muted-foreground">Persuasion</span>
                        <span className="font-semibold text-lg">{aiEvaluation.persuasiveness || 0}%</span>
                      </div>
                    </div>

                    {aiEvaluation.strengths && aiEvaluation.strengths.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-green-700">Strengths</h4>
                        <ul className="text-sm space-y-1">
                          {aiEvaluation.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiEvaluation.weaknesses && aiEvaluation.weaknesses.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-amber-700">Areas for Improvement</h4>
                        <ul className="text-sm space-y-1">
                          {aiEvaluation.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{situation.userProgress?.feedback}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (chapterId && moduleId) {
                      navigate(
                        `/training/chapter/${chapterId}/module/${moduleId}/next-situation`,
                      );
                    } else if (moduleId && chapterId) {
                      navigate(
                        `/training/next-situation?moduleId=${moduleId}&fromChapter=${chapterId}`,
                      );
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
                  <div
                    key={attempt.id || Math.random()}
                    className="border rounded-md p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {attempt.leadershipStyle || "Unknown"} Style
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {attempt.createdAt
                            ? new Date(attempt.createdAt).toLocaleString()
                            : "Unknown date"}
                        </span>
                      </div>
                      <span className="font-semibold">
                        Score: {attempt.score || 0}/100
                      </span>
                    </div>

                    <div className="text-sm">
                      <p className="line-clamp-2">
                        {attempt.response || "No response text available"}
                      </p>
                    </div>

                    {attempt.evaluation ? (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Style</span>
                          <span className="font-semibold">
                            {attempt.evaluation.styleMatchScore || 0}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Clarity</span>
                          <span className="font-semibold">
                            {attempt.evaluation.clarity || 0}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Empathy</span>
                          <span className="font-semibold">
                            {attempt.evaluation.empathy || 0}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1 bg-muted rounded">
                          <span>Persuasion</span>
                          <span className="font-semibold">
                            {attempt.evaluation.persuasiveness || 0}%
                          </span>
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
                See how different leadership styles would approach this
                situation
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
                      {situation.styleResponses?.empathetic}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Inspirational Style</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {situation.styleResponses?.inspirational}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Commanding Style</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {situation.styleResponses?.commanding}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function SituationViewSkeleton() {
  // For skeleton we'll just show a back button to training since parameters may not be ready
  return (
    <AppLayout
      showBackButton
      backTo="/training"
      backLabel="Back to Training"
      pageTitle="Loading Situation..."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-lg p-6 animate-pulse">
          <div className="h-7 w-52 bg-muted rounded mb-2"></div>
          <div className="h-5 w-72 bg-muted rounded mb-8"></div>

          <div className="bg-muted p-4 rounded-md mb-4">
            <div className="h-6 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="bg-primary-foreground border border-primary/20 p-4 rounded-md mb-4">
            <div className="h-6 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
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
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full bg-muted"></div>
                <div className="h-5 w-24 bg-muted rounded"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full bg-muted"></div>
                <div className="h-5 w-28 bg-muted rounded"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 rounded-full bg-muted"></div>
                <div className="h-5 w-26 bg-muted rounded"></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-4 animate-pulse">
            <div className="h-7 w-40 bg-muted rounded mb-2"></div>
            <div className="h-5 w-60 bg-muted rounded mb-6"></div>
            <div className="h-10 w-full bg-muted rounded mb-6"></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
