import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Mic, BarChart, TrendingUp } from "lucide-react";

export default function QuickActions({ recordingsCount, weeklyImprovement }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Record New Conversation */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary rounded-md p-3">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Record Conversation</dt>
                <dd className="text-lg font-semibold text-gray-900">Start a new recording</dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="#record-section" className="font-medium text-primary hover:text-blue-900">
              Start recording &rarr;
            </a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Recent Analyses */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <BarChart className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Recent Analyses</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {recordingsCount} {recordingsCount === 1 ? 'recording' : 'recordings'}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/recordings" className="font-medium text-primary hover:text-blue-900">
              View all analyses &rarr;
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      {/* Weekly Improvement */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Weekly Improvement</dt>
                <dd className="flex items-baseline">
                  <div className="text-lg font-semibold text-gray-900">
                    {weeklyImprovement > 0 ? `+${weeklyImprovement}%` : `${weeklyImprovement}%`}
                  </div>
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
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href="/progress" className="font-medium text-primary hover:text-blue-900">
              View progress &rarr;
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
