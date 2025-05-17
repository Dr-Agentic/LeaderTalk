import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckSquare, Trophy } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getQueryFn } from "../lib/queryClient";
import AppLayout from "@/components/AppLayout";

interface NextSituation {
  completed: boolean;
  message?: string;
  nextSituation?: {
    id: number;
    description: string;
    userPrompt: string;
    module: {
      id: number;
      title: string;
    };
    chapter: {
      id: number;
      title: string;
    };
  };
}

export default function NextSituation() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  // Extract params from both URL patterns - hierarchical and query params
  const queryString = typeof location === 'string' ? location.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryString);
  const queryModuleId = searchParams.get('moduleId');
  const queryChapterId = searchParams.get('fromChapter');
  
  // Extract chapter and module IDs from path: /training/chapter/[chapterId]/module/[moduleId]/next-situation
  let extractedChapterId = null;
  let extractedModuleId = null;
  
  if (location.includes('/chapter/')) {
    const pathParts = location.split('/');
    const chapterIndex = pathParts.indexOf('chapter');
    if (chapterIndex !== -1 && pathParts.length > chapterIndex + 1) {
      extractedChapterId = parseInt(pathParts[chapterIndex + 1]);
      
      // Also check for module ID in the path if it exists
      const moduleIndex = pathParts.indexOf('module');
      if (moduleIndex !== -1 && pathParts.length > moduleIndex + 1) {
        extractedModuleId = parseInt(pathParts[moduleIndex + 1]);
      }
    }
  }
  
  // Use chapter ID from URL path first, then from query params
  const chapterId = extractedChapterId || (queryChapterId ? parseInt(queryChapterId) : null);
  // Use the module ID from path if available, otherwise from query params
  const effectiveModuleId = extractedModuleId || (queryModuleId ? parseInt(queryModuleId) : null);

  // Fetch the next incomplete situation directly from JSON files
  const { data, isLoading: isDataLoading } = useQuery({
    queryKey: ["/api/training/next-situation-direct"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated,
  });

  // If user is not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const isLoading = authLoading || isDataLoading;

  if (isLoading) {
    return <NextSituationSkeleton />;
  }

  // Handle the case where all situations are completed
  if (data?.completed) {
    // Determine the appropriate back navigation path
    const backTo = chapterId && effectiveModuleId 
      ? `/training/chapter/${chapterId}/module/${effectiveModuleId}` 
      : chapterId 
        ? `/training/chapter/${chapterId}`
        : effectiveModuleId 
          ? `/training/module/${effectiveModuleId}` 
          : "/training";
    
    const backLabel = effectiveModuleId 
      ? "Back to Module" 
      : chapterId 
        ? "Back to Chapter" 
        : "Back to Training";
    
    return (
      <AppLayout
        showBackButton
        backTo={backTo}
        backLabel={backLabel}
        pageTitle="Training Complete"
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">All Situations Completed!</CardTitle>
              <CardDescription className="text-center">
                Congratulations! You've completed all available leadership training situations.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                You've mastered the current training content. Check back later for new training
                modules or review your previous responses to continue improving your leadership skills.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4">
              {chapterId ? (
                <Button onClick={() => navigate(effectiveModuleId 
                  ? `/training/chapter/${chapterId}/module/${effectiveModuleId}` 
                  : `/training/chapter/${chapterId}`)}>
                  {effectiveModuleId ? "Return to Module" : "View Chapter Progress"}
                </Button>
              ) : effectiveModuleId ? (
                <Button onClick={() => navigate(`/training/module/${effectiveModuleId}`)}>
                  Return to Module
                </Button>
              ) : (
                <Button onClick={() => navigate("/training")}>
                  View Training Progress
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // If there's a next situation to complete
  if (data?.nextSituation) {
    const { nextSituation } = data;
    
    // Determine the appropriate back navigation path
    const backTo = chapterId && effectiveModuleId 
      ? `/training/chapter/${chapterId}/module/${effectiveModuleId}` 
      : chapterId 
        ? `/training/chapter/${chapterId}`
        : effectiveModuleId 
          ? `/training/module/${effectiveModuleId}` 
          : "/training";
    
    const backLabel = effectiveModuleId 
      ? "Back to Module" 
      : chapterId 
        ? "Back to Chapter" 
        : "Back to Training";
    
    return (
      <AppLayout
        showBackButton
        backTo={backTo}
        backLabel={backLabel}
        pageTitle="Continue Your Training"
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Continue Your Training</CardTitle>
              <CardDescription className="text-center">
                We've found the next leadership situation for you to practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <span>{nextSituation.chapter.title}</span>
                  <ArrowRight className="h-3 w-3 mx-2" />
                  <span>{nextSituation.module.title}</span>
                </div>
                <p className="font-medium">{nextSituation.description}</p>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">What you'll practice:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Responding with different leadership styles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Adapting communication to the situation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Receiving feedback on your approach</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => {
                  if (chapterId) {
                    navigate(`/training/chapter/${chapterId}/module/${nextSituation.module.id}/situation/${nextSituation.id}`);
                  } else if (effectiveModuleId) {
                    // If we have chapter context from the situation data, include it
                    if (nextSituation.chapter && nextSituation.chapter.id) {
                      navigate(`/training/situation/${nextSituation.id}?moduleId=${effectiveModuleId}&fromChapter=${nextSituation.chapter.id}`);
                    } else {
                      navigate(`/training/module/${effectiveModuleId}/situation/${nextSituation.id}`);
                    }
                  } else {
                    // Even if we don't have module context, we might have chapter context
                    if (nextSituation.chapter && nextSituation.chapter.id) {
                      navigate(`/training/situation/${nextSituation.id}?fromChapter=${nextSituation.chapter.id}`);
                    } else {
                      navigate(`/training/situation/${nextSituation.id}`);
                    }
                  }
                }}
              >
                Start Exercise <ArrowRight size={18} />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Fallback if we have no data (should not happen)
  // Determine the appropriate back navigation path for fallback case
  const backTo = chapterId && effectiveModuleId 
    ? `/training/chapter/${chapterId}/module/${effectiveModuleId}` 
    : chapterId 
      ? `/training/chapter/${chapterId}`
      : effectiveModuleId 
        ? `/training/module/${effectiveModuleId}` 
        : "/training";
  
  const backLabel = effectiveModuleId 
    ? "Back to Module" 
    : chapterId 
      ? "Back to Chapter" 
      : "Back to Training";

  return (
    <AppLayout
      showBackButton
      backTo={backTo}
      backLabel={backLabel}
      pageTitle="No Situations Found"
    >
      <div className="text-center mt-10">
        <p>Could not find the next training situation.</p>
        {chapterId ? (
          <Button onClick={() => navigate(effectiveModuleId 
            ? `/training/chapter/${chapterId}/module/${effectiveModuleId}` 
            : `/training/chapter/${chapterId}`)} className="mt-4">
            {effectiveModuleId ? "Return to Module" : "Return to Chapter"}
          </Button>
        ) : effectiveModuleId ? (
          <Button onClick={() => navigate(`/training/module/${effectiveModuleId}`)} className="mt-4">
            Return to Module
          </Button>
        ) : (
          <Button onClick={() => navigate("/training")} className="mt-4">
            Return to Training
          </Button>
        )}
      </div>
    </AppLayout>
  );
}

function NextSituationSkeleton() {
  return (
    <AppLayout
      showBackButton
      backTo="/training"
      backLabel="Back to Training"
      pageTitle="Loading Exercise..."
    >
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-muted rounded-full"></div>
          </div>
          <div className="h-7 w-64 bg-muted rounded mx-auto mb-2"></div>
          <div className="h-5 w-72 bg-muted rounded mx-auto mb-6"></div>
          
          <div className="bg-muted p-4 rounded-md mb-6">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-5 w-full bg-gray-200 rounded"></div>
          </div>
          
          <div className="border-t pt-4 mb-6">
            <div className="h-5 w-40 bg-muted rounded mb-3"></div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-5 bg-muted rounded flex-shrink-0"></div>
                <div className="h-5 w-64 bg-muted rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-5 bg-muted rounded flex-shrink-0"></div>
                <div className="h-5 w-72 bg-muted rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-5 bg-muted rounded flex-shrink-0"></div>
                <div className="h-5 w-56 bg-muted rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="h-10 w-40 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}