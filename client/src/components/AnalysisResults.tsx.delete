import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Home
} from "lucide-react";

interface AnalysisResult {
  improvement: string;
  styleMatchScore: number;
  clarity: number;
  empathy: number;
  persuasiveness: number;
  strengths: string[];
  weaknesses: string[];
}

interface AnalysisResultsProps {
  evaluation: AnalysisResult;
  score: number;
  passed: boolean;
  leadershipStyle: string;
  onNextScenario: () => void;
  onRetry: () => void;
  onReturnToDashboard: () => void;
}

export default function AnalysisResults({
  evaluation,
  score,
  passed,
  leadershipStyle,
  onNextScenario,
  onRetry,
  onReturnToDashboard,
}: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-8 h-8 text-green-500" />
    ) : (
      <XCircle className="w-8 h-8 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            {getScoreIcon(passed)}
            <CardTitle className="text-2xl">
              {passed ? "Great Leadership!" : "Keep Improving!"}
            </CardTitle>
          </div>
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(score)}>{score}/100</span>
          </div>
          <Badge variant={passed ? "default" : "secondary"} className="text-sm">
            {leadershipStyle.charAt(0).toUpperCase() + leadershipStyle.slice(1)} Style
          </Badge>
        </CardHeader>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4" />
                  Style Match
                </span>
                <span className="text-sm font-bold">{evaluation.styleMatchScore}/100</span>
              </div>
              <Progress value={evaluation.styleMatchScore} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  Clarity
                </span>
                <span className="text-sm font-bold">{evaluation.clarity}/100</span>
              </div>
              <Progress value={evaluation.clarity} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Heart className="w-4 h-4" />
                  Empathy
                </span>
                <span className="text-sm font-bold">{evaluation.empathy}/100</span>
              </div>
              <Progress value={evaluation.empathy} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Trophy className="w-4 h-4" />
                  Persuasiveness
                </span>
                <span className="text-sm font-bold">{evaluation.persuasiveness}/100</span>
              </div>
              <Progress value={evaluation.persuasiveness} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <TrendingUp className="w-5 h-5" />
              Growth Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  {weakness}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* AI Coaching Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            AI Coach Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
            {evaluation.improvement}
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={onNextScenario} className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Continue Training
        </Button>
        
        <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        
        <Button variant="ghost" onClick={onReturnToDashboard} className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Training Dashboard
        </Button>
      </div>
    </div>
  );
}