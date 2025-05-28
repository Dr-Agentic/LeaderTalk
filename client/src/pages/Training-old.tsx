import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
// Removed tabs import for linear design
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../hooks/useAuth";
import { ChevronRight, BookOpen, Award, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { getQueryFn } from "../lib/queryClient";
import AppLayout from "@/components/AppLayout";

interface Progress {
  totalSituations: number;
  completedSituations: number;
  passedSituations: number;
  averageScore: number;
  progress: number;
  chapters: ChapterProgress[];
}

interface ChapterProgress {
  id: number;
  title: string;
  order: number;
  modules: ModuleProgress[];
  totalSituations: number;
  completedSituations: number;
  progress: number;
}

interface ModuleProgress {
  id: number;
  title: string;
  order: number;
  totalSituations: number;
  completedSituations: number;
  progress: number;
}

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

export default function Training() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("progress");
  const [, navigate] = useLocation();

  // Get all chapters from JSON files directly
  const { data: chaptersData, isLoading: isChaptersLoading } = useQuery({
    queryKey: ["/api/training/chapters-direct"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated,
  });
  
  // Get user progress - this is still from the database since it's user-specific
  const { data: progress, isLoading: isProgressLoading } = useQuery({
    queryKey: ["/api/training/progress"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated,
  });

  // Use direct JSON endpoint for next situation
  const { data: nextSituation, isLoading: isNextSituationLoading } = useQuery({
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

  const isLoading = authLoading || isProgressLoading || isNextSituationLoading || isChaptersLoading;

  if (isLoading) {
    return <TrainingSkeleton />;
  }

  return (
    <AppLayout
      showBackButton
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="Training"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mt-2">Leadership Training</h1>
        <p className="text-muted-foreground mb-6">
          Improve your leadership communication skills through guided exercises
        </p>
        
        {nextSituation && !nextSituation.completed && (
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => navigate(`/training/chapter/${nextSituation.nextSituation.chapter.id}/module/${nextSituation.nextSituation.module.id}/situation/${nextSituation.nextSituation.id}`)}
          >
            Continue Training <ArrowRight size={18} />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="chapters">Chapters & Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          {progress && (
            <>
              <ProgressOverview progress={progress} chaptersCount={chaptersData?.length} />
              <RecentCompletions />
            </>
          )}
        </TabsContent>

        <TabsContent value="chapters" className="space-y-6">
          {chaptersData && Array.isArray(chaptersData) && (
            <div className="space-y-6">
              {chaptersData.map((chapter: any) => (
                <Card key={chapter.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>{chapter.chapter_title}</CardTitle>
                    </div>
                    <CardDescription>
                      Chapter {chapter.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chapter.modules.map((module: any) => (
                        <Link 
                          key={module.id} 
                          href={`/training/chapter/${chapter.id}/module/${module.id}`}
                        >
                          <div className="flex justify-between items-center p-3 rounded-md border hover:bg-muted cursor-pointer">
                            <div className="flex gap-3 items-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{module.module_title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {module.scenarios.length} situations
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

function ProgressOverview({ progress, chaptersCount }: { progress: Progress; chaptersCount?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.progress}%</div>
          <Progress value={progress.progress} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {progress.completedSituations} of {progress.totalSituations} situations completed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(progress.averageScore)}</div>
          <Progress value={progress.averageScore} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Based on {progress.completedSituations} completed situations
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Passed Situations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {progress.passedSituations} / {progress.completedSituations}
          </div>
          <Progress 
            value={progress.completedSituations > 0 
              ? (progress.passedSituations / progress.completedSituations) * 100 
              : 0
            } 
            className="h-2 mt-2" 
          />
          <p className="text-xs text-muted-foreground mt-2">
            {((progress.passedSituations / Math.max(1, progress.completedSituations)) * 100).toFixed(0)}% pass rate
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Chapters Explored</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {chaptersCount ? `0 / ${chaptersCount}` : '0 / 0'}
          </div>
          <Progress 
            value={0} 
            className="h-2 mt-2" 
          />
          <p className="text-xs text-muted-foreground mt-2">
            0 chapters fully completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentCompletions() {
  // This would be implemented with actual data from the API
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest completed leadership exercises</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Your Progress Will Show Here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your first leadership exercise to see your progress and scores
          </p>
          <p className="text-xs text-muted-foreground">
            Start with the chapters below to begin your leadership journey
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChaptersList({ chapters }: { chapters: ChapterProgress[] }) {
  return (
    <div className="space-y-6">
      {chapters.map((chapter) => (
        <Card key={chapter.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{chapter.title}</CardTitle>
              <Progress value={chapter.progress} className="w-24 h-2" />
            </div>
            <CardDescription>
              {chapter.completedSituations} of {chapter.totalSituations} situations completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chapter.modules.map((module) => (
                <Link 
                  key={module.id} 
                  href={`/training/chapter/${chapter.id}/module/${module.id}`}
                >
                  <div className="flex justify-between items-center p-3 rounded-md border hover:bg-muted cursor-pointer">
                    <div className="flex gap-3 items-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{module.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.completedSituations} of {module.totalSituations} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={module.progress} className="w-20 h-2" />
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrainingSkeleton() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
          <div className="h-5 w-96 bg-muted rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-40 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="h-12 w-80 bg-muted rounded animate-pulse mb-8"></div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 h-32 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded mb-4"></div>
            <div className="h-8 w-16 bg-muted rounded mb-2"></div>
            <div className="h-2 w-full bg-muted rounded mb-2"></div>
            <div className="h-4 w-40 bg-muted rounded"></div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4 mt-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-2"></div>
        <div className="h-4 w-72 bg-muted rounded mb-6"></div>
        
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex justify-between items-center border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded-full"></div>
              <div>
                <div className="h-5 w-48 bg-muted rounded mb-1"></div>
                <div className="h-4 w-36 bg-muted rounded"></div>
              </div>
            </div>
            <div className="h-4 w-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}