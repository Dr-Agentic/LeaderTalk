import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
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

export default function TestSituation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [response, setResponse] = useState("");
  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>('input');
  const [progress, setProgress] = useState(0);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);

  // Mock situation data for testing
  const situation = {
    id: 8,
    description: "During a quarterly team meeting, one of your team members interrupts another colleague mid-presentation to challenge their data analysis. The tension in the room is palpable, and other team members are looking uncomfortable. The presenting colleague appears flustered and defensive.",
    userPrompt: "How would you handle this situation to maintain team harmony while ensuring productive discussion?",
    assignedLeadershipStyle: "empathetic"
  };

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
      situationId: situation.id,
      response: response.trim(),
      leadershipStyle: situation.assignedLeadershipStyle
    });
  };

  const handleContinue = () => {
    navigate("/training");
  };

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
              <div className="text-center text-sm text-secondary">
                AI is evaluating your leadership response and providing personalized feedback...
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results View */}
        {submissionPhase === 'complete' && aiEvaluation && (
          <TrainingResultsView
            evaluation={aiEvaluation}
            assignedStyle={situation.assignedLeadershipStyle}
            userResponse={response}
            onContinue={handleContinue}
          />
        )}

        {/* Input View */}
        {submissionPhase === 'input' && (
          <>
            {/* Test Notice */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-blue-800 text-center">
                  <strong>Testing New Submission Flow</strong> - Experience the simplified training process
                </p>
              </CardContent>
            </Card>

            {/* Situation Header */}
            <Card>
              <CardHeader>
                <CardTitle>Chapter 1 • Module 3 • Situation 8</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Situation:</h3>
                    <p>{situation.description}</p>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg">
                    <h3 className="font-medium mb-2">Your Leadership Style:</h3>
                    <p className="text-xl font-semibold capitalize text-primary">
                      {situation.assignedLeadershipStyle}
                    </p>
                    <p className="text-sm text-secondary mt-1">
                      Respond using an {situation.assignedLeadershipStyle} leadership approach.
                    </p>
                  </div>

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
          </>
        )}
      </div>
    </AppLayout>
  );
}