import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "../hooks/useAuth";
import { ChevronRight, BookOpen, Award, CheckCircle, Play } from "lucide-react";
import AppLayout from "@/components/AppLayout";

export default function Training() {
  const { isAuthenticated } = useAuth();

  // Get all chapters from JSON files
  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ["/api/training/chapters"],
    enabled: isAuthenticated,
  });

  // Get user progress
  const { data: userProgress } = useQuery({
    queryKey: ["/api/training/progress"],
    enabled: isAuthenticated,
  });

  // Get next recommended situation
  const { data: nextSituation } = useQuery({
    queryKey: ["/api/training/next-situation-direct"],
    enabled: isAuthenticated,
  });

  if (chaptersLoading) {
    return (
      <AppLayout pageTitle="Leadership Training">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const totalSituations =
    chapters?.reduce(
      (total: number, chapter: any) =>
        total +
        chapter.modules.reduce(
          (moduleTotal: number, module: any) =>
            moduleTotal + module.scenarios.length,
          0,
        ),
      0,
    ) || 0;

  const completedSituations = userProgress?.length || 0;
  const progressPercentage =
    totalSituations > 0 ? (completedSituations / totalSituations) * 100 : 0;

  return (
    <AppLayout pageTitle="Leadership Training">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Award className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl font-bold">Leadership Training</h1>
          </div>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Master essential leadership skills through interactive scenarios and
            personalized feedback.
          </p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Your Progress
            </CardTitle>
            <CardDescription>
              Track your advancement through the leadership training program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completed Situations</span>
              <span>
                {completedSituations} of {totalSituations}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-center text-sm text-secondary">
              {Math.round(progressPercentage)}% Complete
            </div>
          </CardContent>
        </Card>

        {/* Continue Training Button */}
        {nextSituation && !nextSituation.completed && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Play className="h-5 w-5 mr-2" />
                Continue Your Training
              </CardTitle>
              <CardDescription>
                Ready for your next leadership challenge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/training/next-situation">
                <Button size="lg" className="w-full">
                  Start Next Exercise
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Training Chapters */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Training Chapters</h2>

          {chapters?.map((chapter: any, index: number) => {
            const chapterProgress = chapter.modules.reduce(
              (total: number, module: any) => {
                const moduleCompleted =
                  userProgress?.filter(
                    (p: any) =>
                      p.chapterId === chapter.id && p.moduleId === module.id,
                  ).length || 0;
                return total + moduleCompleted;
              },
              0,
            );

            const chapterTotal = chapter.modules.reduce(
              (total: number, module: any) => total + module.scenarios.length,
              0,
            );

            const chapterPercentage =
              chapterTotal > 0 ? (chapterProgress / chapterTotal) * 100 : 0;

            return (
              <Card
                key={chapter.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center">
                        <BookOpen className="h-5 w-5 text-primary mr-2" />
                        {chapter.chapter_title}
                      </CardTitle>
                      <CardDescription>
                        {chapter.modules.length} modules • {chapterTotal}{" "}
                        exercises
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-secondary">
                        {chapterProgress} of {chapterTotal} completed
                      </div>
                      <Progress
                        value={chapterPercentage}
                        className="h-1 w-20 mt-1"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chapter.modules.map((module: any) => {
                      const moduleCompleted =
                        userProgress?.filter(
                          (p: any) =>
                            p.chapterId === chapter.id &&
                            p.moduleId === module.id,
                        ).length || 0;

                      const moduleTotal = module.scenarios.length;
                      const isModuleComplete = moduleCompleted === moduleTotal;

                      return (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {module.module_title}
                            </h4>
                            <p className="text-sm text-secondary">
                              {module.leadership_trait} • {moduleTotal}{" "}
                              exercises
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-secondary">
                              {moduleCompleted}/{moduleTotal}
                            </div>
                            {isModuleComplete ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Link
                                href={`/training/chapter/${chapter.id}/module/${module.id}`}
                              >
                                <Button variant="outline" size="sm">
                                  {moduleCompleted > 0 ? "Continue" : "Start"}
                                  <ChevronRight className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
