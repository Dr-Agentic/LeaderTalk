import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Trophy, Target, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

type SubmissionPhase = 'input' | 'submitting' | 'complete';

interface Situation {
  id: number;
  description: string;
  userPrompt: string;
  assignedLeadershipStyle: string;
}

interface EvaluationResult {
  styleMatchScore: number;
  clarity: number;
  empathy: number;
  persuasiveness: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
  passed: boolean;
}

export default function SituationView() {
  const { chapterId, moduleId, situationId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [response, setResponse] = useState("");
  const [submissionPhase, setSubmissionPhase] = useState<SubmissionPhase>('input');
  const [progress, setProgress] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Fetch situation data
  const { data: situation, isLoading } = useQuery({
    queryKey: [`/api/training/chapters/${chapterId}/modules/${moduleId}/situations/${situationId}`],
    enabled: !!(chapterId && moduleId && situationId),
  });

  // Fetch user's attempts for this situation
  const { data: attemptsData } = useQuery({
    queryKey: [`/api/training/attempts`],
    enabled: !!situationId,
  });

  // Progress bar simulation during submission
  useEffect(() => {
    if (submissionPhase === 'submitting') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Cap at 90% until we get results
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [submissionPhase]);

  // Submit response mutation
  const submitMutation = useMutation({
    mutationFn: async (data: { situationId: number; response: string; leadershipStyle: string }) => {
      return apiRequest("POST", "/api/training/submit-with-ai-evaluation", data);
    },
    onSuccess: (data) => {
      console.log("Submission successful:", data);
      
      // Complete the progress bar
      setProgress(100);
      
      // Set evaluation data
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setSubmissionPhase('complete');
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/training/attempts`] });
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
        description: "Please provide your response before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!situation) {
      toast({
        title: "Error",
        description: "Situation data not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmissionPhase('submitting');
    submitMutation.mutate({
      situationId: parseInt(situationId!),
      response: response.trim(),
      leadershipStyle: situation.assignedLeadershipStyle,
    });
  };

  const handleTryAgain = () => {
    setResponse("");
    setSubmissionPhase('input');
    setProgress(0);
    setEvaluation(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <AppLayout pageTitle="Loading Exercise...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!situation) {
    return (
      <AppLayout pageTitle="Exercise Not Found">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Exercise Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested training exercise could not be found.
          </p>
          <Link href="/training">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Training
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Filter attempts for this specific situation
  const situationAttempts = attemptsData?.filter((attempt: any) => 
    attempt.situationId === parseInt(situationId!)
  ) || [];

  return (
    <AppLayout pageTitle="Leadership Exercise">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <Link href={`/training/chapter/${chapterId}/module/${moduleId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Module
            </Button>
          </Link>
          
          <Badge variant="outline" className="text-sm">
            {situation.assignedLeadershipStyle} Style
          </Badge>
        </div>

        {/* Input Phase */}
        {submissionPhase === 'input' && (
          <div className="space-y-6">
            {/* Situation Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 text-primary mr-2" />
                  Scenario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed mb-4">
                  {situation.description}
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium text-primary mb-2">Your Task:</p>
                  <p>{situation.userPrompt}</p>
                </div>
              </CardContent>
            </Card>

            {/* Response Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-primary mr-2" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your response here... Consider your leadership style and the situation requirements."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                  className="min-h-[150px]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {response.length} characters
                  </span>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!response.trim() || submitMutation.isPending}
                    size="lg"
                  >
                    Submit Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submitting Phase */}
        {submissionPhase === 'submitting' && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">Analyzing Your Response</h3>
                  <p className="text-muted-foreground">
                    Our AI is evaluating your leadership approach and providing personalized feedback...
                  </p>
                  <div className="max-w-xs mx-auto">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {Math.round(progress)}% complete
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Phase */}
        {submissionPhase === 'complete' && evaluation && (
          <div className="space-y-6">
            {/* Overall Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 text-primary mr-2" />
                  Evaluation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.styleMatchScore)}`}>
                      {evaluation.styleMatchScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Style Match</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.clarity)}`}>
                      {evaluation.clarity}%
                    </div>
                    <div className="text-sm text-muted-foreground">Clarity</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.empathy)}`}>
                      {evaluation.empathy}%
                    </div>
                    <div className="text-sm text-muted-foreground">Empathy</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(evaluation.persuasiveness)}`}>
                      {evaluation.persuasiveness}%
                    </div>
                    <div className="text-sm text-muted-foreground">Persuasiveness</div>
                  </div>
                </div>

                <div className="text-center">
                  <Badge variant={getScoreBadgeVariant(evaluation.overallScore)} className="text-lg px-4 py-2">
                    Overall Score: {evaluation.overallScore}%
                    {evaluation.passed ? " - PASSED" : " - NEEDS IMPROVEMENT"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Feedback */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {evaluation.improvement}
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={handleTryAgain}>
                Try Again
              </Button>
              <Link href={`/training/chapter/${chapterId}/module/${moduleId}`}>
                <Button>
                  Continue Training
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Previous Attempts */}
        {situationAttempts.length > 0 && submissionPhase === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {situationAttempts.slice(0, 3).map((attempt: any, index: number) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div>
                      <div className="font-medium">Attempt #{situationAttempts.length - index}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {attempt.score && (
                      <Badge variant={getScoreBadgeVariant(attempt.score)}>
                        {attempt.score}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}