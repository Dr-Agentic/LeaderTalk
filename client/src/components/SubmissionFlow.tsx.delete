import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, ArrowRight, Home, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import AnalysisResults from "./AnalysisResults";

interface SubmissionFlowProps {
  userResponse: string;
  exampleResponse: string;
  aiEvaluation: any | null;
  isAnalyzing: boolean;
  onContinue: () => void;
  situationId: number;
  moduleId?: number;
  chapterId?: number;
}

export default function SubmissionFlow({
  userResponse,
  exampleResponse,
  aiEvaluation,
  isAnalyzing,
  onContinue,
  situationId,
  moduleId,
  chapterId
}: SubmissionFlowProps) {
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState(isAnalyzing ? 50 : 100);

  // Simulate progress updates during analysis
  useState(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  });

  const handleNavigation = (destination: string) => {
    switch (destination) {
      case 'next':
        onContinue();
        break;
      case 'training':
        navigate('/training');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'retry':
        window.location.reload();
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Your Response Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Response Submitted
          </CardTitle>
          <CardDescription>
            Your leadership response has been recorded for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm italic">"{userResponse}"</p>
          </div>
        </CardContent>
      </Card>

      {/* Example Response */}
      <Card>
        <CardHeader>
          <CardTitle>Expert Example Response</CardTitle>
          <CardDescription>
            Here's how a leadership expert might approach this scenario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm">{exampleResponse}</p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress or Results */}
      {isAnalyzing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500 animate-spin" />
              AI Analysis in Progress
            </CardTitle>
            <CardDescription>
              Our AI coach is evaluating your leadership communication...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground text-center">
              Analyzing style alignment, clarity, empathy, and persuasiveness...
            </div>
          </CardContent>
        </Card>
      ) : aiEvaluation ? (
        <AnalysisResults
          evaluation={aiEvaluation}
          score={Math.round((aiEvaluation.styleMatchScore + aiEvaluation.clarity + aiEvaluation.empathy + aiEvaluation.persuasiveness) / 4)}
          passed={Math.round((aiEvaluation.styleMatchScore + aiEvaluation.clarity + aiEvaluation.empathy + aiEvaluation.persuasiveness) / 4) >= 70}
          leadershipStyle={leadershipStyle}
          onNextScenario={onNextScenario}
          onRetry={onRetry}
          onReturnToDashboard={() => navigate("/training")}
        />
      ) : null}

      {/* Navigation Options */}
      {!isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
            <CardDescription>
              Choose your next step in your leadership development journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={() => handleNavigation('next')} 
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Continue to Next Scenario
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNavigation('training')}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Training Progress
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNavigation('dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleNavigation('retry')}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try This Scenario Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}