import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TrainingResultsView from "@/components/TrainingResultsView";

type SubmissionPhase = 'input' | 'submitting' | 'complete';

export default function SituationView() {
  const { chapterId, moduleId, situationId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [response, setResponse] = useState("");
  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>('input');
  const [progress, setProgress] = useState(0);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);

  // Fetch situation data
  const { data: situation, isLoading } = useQuery({
    queryKey: [`/api/training/situations-direct/${situationId}`],
    enabled: !!situationId,
  });

  // Fetch user's attempts for this situation
  const { data: attemptsData } = useQuery({
    queryKey: [`/api/training/situations/${situationId}/attempts`],
    enabled: !!situationId,
  });

  // Progress bar simulation during submission
  useEffect(() => {
    if (submissionPhase === 'submitting') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Cap at 90% until we get results
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [submissionPhase]);

  // AI Evaluation Mutation
  const submitMutation = useMutation({
    mutationFn: async (data: { situationId: number; response: string; leadershipStyle: string }) => {
      return apiRequest("POST", "/api/training/submit-with-ai-evaluation", data);
    },
    onSuccess: (data) => {
      console.log("AI submission successful:", data);
      
      // Complete the progress bar
      setProgress(100);
      
      // Set evaluation data
      if (data.evaluation) {
        setAiEvaluation(data.evaluation);
        setSubmissionPhase('complete');
        
        // Invalidate queries
        queryClient.invalidateQueries({
          queryKey: [`/api/training/situations/${situationId}/attempts`],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/training/progress"] });

        toast({
          title: "Analysis Complete!",
          description: "Your response has been evaluated with detailed feedback.",
        });
      } else {
        console.error("No evaluation data received:", data);
        setSubmissionPhase('input');
        setProgress(0);
        toast({
          title: "Error",
          description: "Failed to get AI analysis. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Submission error:", error);
      setSubmissionPhase('input');
      setProgress(0);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!response.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a response before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmissionPhase('submitting');
    setProgress(10);

    submitMutation.mutate({
      situationId: parseInt(situationId!),
      response: response.trim(),
      leadershipStyle: situation?.assignedLeadershipStyle || 'empathetic'
    });
  };

  const handleContinue = () => {
    // Navigate to next situation or back to training overview
    navigate("/training");
  };

  if (isLoading) {
    return (
      <AppLayout showBackButton backTo="/training" backLabel="Back to Training">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!situation) {
    return (
      <AppLayout showBackButton backTo="/training" backLabel="Back to Training">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Situation Not Found</h1>
          <p className="mb-6">The requested training situation could not be found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton backTo="/training" backLabel="Back to Training">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Submission Progress View */}
        {submissionPhase === 'submitting' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Your Response...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="text-center text-sm text-muted-foreground">
                AI is evaluating your leadership response and providing personalized feedback...
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results View */}
        {submissionPhase === 'complete' && aiEvaluation && (
          <TrainingResultsView
            evaluation={aiEvaluation}
            assignedStyle={situation.assignedLeadershipStyle || 'empathetic'}
            userResponse={response}
            onContinue={handleContinue}
          />
        )}

        {/* Input View */}
        {submissionPhase === 'input' && (
          <>
            {/* Situation Header */}
            <Card>
              <CardHeader>
                <CardTitle>Chapter {chapterId} • Module {moduleId} • Situation {situationId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Situation:</h3>
                    <p>{situation.description}</p>
                  </div>

                  {situation.assignedLeadershipStyle && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h3 className="font-medium mb-2">Your Leadership Style:</h3>
                      <p className="text-xl font-semibold capitalize text-primary">
                        {situation.assignedLeadershipStyle}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Respond using a {situation.assignedLeadershipStyle} leadership approach.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-accent/20 rounded-lg">
                    <h3 className="font-medium mb-2">Your Task:</h3>
                    <p>{situation.userPrompt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Input */}
            <Card>
              <CardHeader>
                <CardTitle>Your Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your leadership response here..."
                  className="min-h-32"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  disabled={submissionPhase === 'submitting'}
                />
                
                <Button 
                  onClick={handleSubmit}
                  disabled={submissionPhase === 'submitting' || !response.trim()}
                  className="w-full"
                  size="lg"
                >
                  {submissionPhase === 'submitting' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting for AI Analysis...
                    </>
                  ) : (
                    "Submit Response for AI Analysis"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Previous Attempts */}
            {attemptsData?.attempts && attemptsData.attempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Attempts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attemptsData.attempts.map((attempt: any, index: number) => (
                      <div key={attempt.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Attempt {index + 1}</span>
                          {attempt.evaluation && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Score: {attempt.evaluation.styleMatchScore}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm italic">"{attempt.response}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}