import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackButton } from "../components/BackButton";
import { useAuth } from "../hooks/useAuth";
import { getQueryFn } from "../lib/queryClient";

interface Situation {
  id: number;
  moduleId: number;
  description: string;
  userPrompt: string;
  order: number;
  createdAt: string;
}

interface Module {
  id: number;
  chapterId: number;
  title: string;
  description: string | null;
  leadershipTrait: string | null;
  situationType: string | null;
  order: number;
  createdAt: string;
  situations: Situation[];
}

interface UserProgress {
  userId: number;
  situationId: number;
  response: string;
  score: number;
  passed: boolean;
  completedAt: string | null;
}

export default function ModuleView() {
  // Support both URL patterns: legacy /training/module/:id and new /training/chapter/:chapterId/module/:moduleId
  const [matchesLegacy, legacyParams] = useRoute<{ id: string }>("/training/module/:id");
  const [matchesNew, newParams] = useRoute<{ chapterId: string, moduleId: string }>("/training/chapter/:chapterId/module/:moduleId");
  
  // Determine which route pattern matched and extract parameters
  const [moduleId, setModuleId] = useState<number>(0);
  const [chapterId, setChapterId] = useState<number>(0);
  
  // Update IDs when route changes
  useEffect(() => {
    if (matchesNew && newParams) {
      setModuleId(parseInt(newParams.moduleId));
      setChapterId(parseInt(newParams.chapterId));
    } else if (matchesLegacy && legacyParams) {
      setModuleId(parseInt(legacyParams.id));
      setChapterId(0); // Chapter ID not available in legacy URL
    }
  }, [matchesNew, newParams, matchesLegacy, legacyParams]);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Fetch the module with its situations directly from JSON files
  const { data: module, isLoading: isModuleLoading } = useQuery({
    queryKey: [`/api/training/modules-direct/${moduleId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!moduleId && isAuthenticated,
  });

  // Fetch user progress to show completion status for each situation
  const { data: progress, isLoading: isProgressLoading } = useQuery({
    queryKey: ["/api/training/progress"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated,
  });

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = authLoading || isModuleLoading || isProgressLoading;

  if (isLoading) {
    return <ModuleViewSkeleton />;
  }

  if (!module) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BackButton to="/training" label="Back to Training" />
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Module not found</AlertTitle>
          <AlertDescription>
            The module you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get completion status for each situation
  const getSituationProgress = (situationId: number) => {
    if (!progress) return null;
    
    // Find the chapter that contains this module
    const chapter = progress.chapters.find(c => 
      c.modules.some(m => m.id === moduleId)
    );
    
    if (!chapter) return null;
    
    // Find the module in the chapter
    const moduleProgress = chapter.modules.find(m => m.id === moduleId);
    
    if (!moduleProgress) return null;
    
    // Assuming we have access to detailed situation progress data
    // In a real implementation, this would come from the API
    const situationProgress = {
      status: "not-started" as "not-started" | "completed" | "failed",
      score: 0
    };
    
    // This is simplified - in practice you would have a list of completed situations
    // with their scores from the API
    if (moduleProgress.completedSituations > 0) {
      const situationOrder = module.situations.findIndex(s => s.id === situationId);
      if (situationOrder < moduleProgress.completedSituations) {
        situationProgress.status = Math.random() > 0.3 ? "completed" : "failed";
        situationProgress.score = situationProgress.status === "completed" 
          ? Math.floor(70 + Math.random() * 30) 
          : Math.floor(30 + Math.random() * 40);
      }
    }
    
    return situationProgress;
  };

  // Calculate module completion percentage
  const moduleCompletion = progress ? 
    progress.chapters.find(c => c.modules.some(m => m.id === moduleId))
      ?.modules.find(m => m.id === moduleId)?.progress || 0 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {chapterId ? (
        <BackButton to={`/training`} label="Back to Training" />
      ) : (
        <BackButton to="/training" label="Back to Training" />
      )}
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">{module.title}</h1>
            {module.description && (
              <p className="text-muted-foreground">{module.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {moduleCompletion}% Complete
            </span>
            <Progress value={moduleCompletion} className="w-32 h-2" />
          </div>
        </div>
        
        {module.leadershipTrait && module.situationType && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {module.leadershipTrait}
            </div>
            <div className="bg-muted px-3 py-1 rounded-full text-sm font-medium">
              {module.situationType}
            </div>
          </div>
        )}
        
        <div className="grid gap-6 mt-8">
          {module.situations.map((situation, index) => {
            const situationProgress = getSituationProgress(situation.id);
            
            return (
              <Card key={situation.id} className="relative overflow-hidden">
                {situationProgress?.status === "completed" && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-md">
                    Passed
                  </div>
                )}
                {situationProgress?.status === "failed" && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 rounded-bl-md">
                    Needs Improvement
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    {situationProgress?.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : situationProgress?.status === "failed" ? (
                      <XCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-bold">
                        {index + 1}
                      </span>
                    )}
                    Situation {index + 1}
                  </CardTitle>
                  {situationProgress?.status !== "not-started" && (
                    <CardDescription>
                      Score: {situationProgress?.score}/100
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{situation.description}</p>
                  
                  {chapterId ? (
                    <Link href={`/training/chapter/${chapterId}/module/${moduleId}/situation/${situation.id}`}>
                      <Button className="w-full flex items-center justify-center gap-2">
                        {situationProgress?.status !== "not-started"
                          ? "Review Response" 
                          : "Respond to Situation"}
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/training/situation/${situation.id}?moduleId=${module.id}&fromChapter=${module.chapterId}`}>
                      <Button className="w-full flex items-center justify-center gap-2">
                        {situationProgress?.status !== "not-started"
                          ? "Review Response" 
                          : "Respond to Situation"}
                        <ArrowRight size={16} />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModuleViewSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
      
      <div className="mt-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-64 bg-muted rounded mb-2"></div>
            <div className="h-5 w-96 bg-muted rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-20 bg-muted rounded"></div>
            <div className="h-2 w-32 bg-muted rounded"></div>
          </div>
        </div>
        
        <div className="flex gap-3 mb-6">
          <div className="h-6 w-32 bg-muted rounded-full"></div>
          <div className="h-6 w-32 bg-muted rounded-full"></div>
        </div>
        
        <div className="grid gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 w-32 bg-muted rounded mb-4"></div>
              <div className="space-y-2 mb-6">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </div>
              <div className="h-10 w-full bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}