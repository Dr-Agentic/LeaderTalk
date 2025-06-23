import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, ArrowRight, Trophy, Target, TrendingUp } from "lucide-react";

interface TrainingResultsViewProps {
  evaluation: {
    overallScore: number;
    improvement: string;
    styleMatchScore: number;
    clarity: number;
    empathy: number;
    persuasiveness: number;
    strengths: string[];
    weaknesses: string[];
  };
  assignedStyle: string;
  userResponse: string;
  onContinue: () => void;
}

// Helper function to get score-based icon and styling
const getScoreIcon = (score: number) => {
  if (score > 80) {
    return { icon: Trophy, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
  } else if (score > 60) {
    return { icon: Target, color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
  } else {
    return { icon: TrendingUp, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
  }
};

const getScoreColor = (score: number) => {
  if (score > 80) return "text-green-600";
  if (score > 60) return "text-yellow-600";
  return "text-blue-600";
};

export default function TrainingResultsView({ 
  evaluation, 
  assignedStyle, 
  userResponse, 
  onContinue 
}: TrainingResultsViewProps) {
  const passed = evaluation.styleMatchScore >= 70;
  const scoreInfo = getScoreIcon(evaluation.overallScore);
  const ScoreIcon = scoreInfo.icon;

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={`${scoreInfo.borderColor} ${scoreInfo.bgColor}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ScoreIcon className={`h-8 w-8 ${scoreInfo.color}`} />
            <div>
              <div className="text-2xl font-bold">Overall Score</div>
              <div className={`text-4xl font-bold ${scoreInfo.color}`}>{evaluation.overallScore}%</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className={`text-lg font-medium ${scoreInfo.color}`}>
              {evaluation.overallScore > 80 ? "Excellent Leadership Response!" : 
               evaluation.overallScore > 60 ? "Good Progress - Keep Building!" : 
               "Great Start - Room to Grow!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Scores Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.styleMatchScore)}`}>{evaluation.styleMatchScore}%</div>
              <div className="text-sm text-secondary">Style Match</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.clarity)}`}>{evaluation.clarity}%</div>
              <div className="text-sm text-secondary">Clarity</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.empathy)}`}>{evaluation.empathy}%</div>
              <div className="text-sm text-secondary">Empathy</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(evaluation.persuasiveness)}`}>{evaluation.persuasiveness}%</div>
              <div className="text-sm text-secondary">Persuasion</div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg mb-2">
              <span className="font-medium">Leadership Style:</span> 
              <span className="capitalize text-primary ml-2">{assignedStyle}</span>
            </p>
            <p className={`text-lg font-medium ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
              {passed ? '✅ Excellent work!' : '💡 Good effort - room for improvement'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Your Response */}
      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="italic">"{userResponse}"</p>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>AI Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Overall Assessment</h4>
            <p className="text-sm">{evaluation.improvement}</p>
          </div>

          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-green-700">✅ Strengths</h4>
              <ul className="text-sm space-y-1">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-amber-700">💡 Areas for Improvement</h4>
              <ul className="text-sm space-y-1">
                {evaluation.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={onContinue} className="w-full" size="lg">
            Continue to Next Exercise <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}