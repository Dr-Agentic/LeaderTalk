import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Mic, BarChart, TrendingUp, GraduationCap } from "lucide-react";
import { SmallText, H4 } from "@/components/ui/typography";

export default function QuickActions({ recordingsCount, weeklyImprovement }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Record New Conversation */}
      <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <CardContent className="p-card-inner pt-6 pb-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-primary rounded-md p-3">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt><SmallText className="truncate">Record Conversation</SmallText></dt>
                <dd><H4>Start a new recording</H4></dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-card-inner py-3 border-t">
          <div>
            <a href="#record-section" className="font-sans text-sm font-medium text-primary hover:text-blue-900 flex items-center">
              Start recording <span className="ml-1">&rarr;</span>
            </a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Recent Analyses */}
      <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <CardContent className="p-card-inner pt-6 pb-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-secondary rounded-md p-3">
              <BarChart className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt><SmallText className="truncate">Recent Analyses</SmallText></dt>
                <dd><H4>
                  {recordingsCount} {recordingsCount === 1 ? 'recording' : 'recordings'}
                </H4></dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-card-inner py-3 border-t">
          <div>
            <Link href="/transcripts" className="font-sans text-sm font-medium text-primary hover:text-blue-900 flex items-center">
              View all analyses <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Weekly Improvement */}
      <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <CardContent className="p-card-inner pt-6 pb-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-primary rounded-md p-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt><SmallText className="truncate">Weekly Improvement</SmallText></dt>
                <dd className="flex items-baseline">
                  <H4 className="flex items-center">
                    {weeklyImprovement > 0 ? `+${weeklyImprovement}%` : `${weeklyImprovement}%`}
                  </H4>
                  {weeklyImprovement > 0 && (
                    <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="sr-only">Increased by</span>
                      vs last week
                    </p>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-card-inner py-3 border-t">
          <div>
            <Link href="/progress" className="font-sans text-sm font-medium text-primary hover:text-blue-900 flex items-center">
              View progress <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Training Module */}
      <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <CardContent className="p-card-inner pt-6 pb-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gradient-secondary rounded-md p-3">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt><SmallText className="truncate">Training Module</SmallText></dt>
                <dd><H4>
                  Improve your skills
                </H4></dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-card-inner py-3 border-t">
          <div>
            <Link href="/training" className="font-sans text-sm font-medium text-primary hover:text-blue-900 flex items-center">
              Start training <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
