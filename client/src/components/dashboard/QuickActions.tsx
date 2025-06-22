import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Mic, BarChart, TrendingUp, GraduationCap } from "lucide-react";
import { SmallText, H4 } from "@/components/ui/typography";

export default function QuickActions({ recordingsCount, weeklyImprovement }: { recordingsCount: number; weeklyImprovement: number }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Record New Conversation */}
      <Card className="glass-card p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md gradient-primary">
            <Mic className="h-5 w-5 card-title" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt><SmallText className="truncate card-title/70">Record Conversation</SmallText></dt>
              <dd><H4 className="card-title">Start a new recording</H4></dd>
            </dl>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div>
            <Link href="/recording" className="font-sans text-sm font-medium card-title hover:text-purple-300 flex items-center">
              Start recording <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </Card>
      
      {/* Recent Analyses */}
      <Card className="glass-card p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md" style={{background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)'}}>
            <BarChart className="h-5 w-5 card-title" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt><SmallText className="truncate card-title/70">Recent Analyses</SmallText></dt>
              <dd><H4 className="card-title">
                {recordingsCount} {recordingsCount === 1 ? 'recording' : 'recordings'}
              </H4></dd>
            </dl>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div>
            <Link href="/transcripts" className="font-sans text-sm font-medium card-title hover:text-purple-300 flex items-center">
              View all analyses <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </Card>
      
      {/* Weekly Improvement */}
      <Card className="glass-card p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md" style={{background: 'linear-gradient(135deg, #4ECDC4, #44A08D)'}}>
            <TrendingUp className="h-5 w-5 card-title" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt><SmallText className="truncate card-title/70">Weekly Improvement</SmallText></dt>
              <dd className="flex items-baseline">
                <H4 className="flex items-center card-title">
                  {weeklyImprovement > 0 ? `+${weeklyImprovement}%` : `${weeklyImprovement}%`}
                </H4>
                {weeklyImprovement > 0 && (
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
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
        <div className="mt-4 pt-4 border-t border-white/10">
          <div>
            <Link href="/progress" className="font-sans text-sm font-medium card-title hover:text-purple-300 flex items-center">
              View progress <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </Card>
      
      {/* Training Module */}
      <Card className="glass-card p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 rounded-md" style={{background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>
            <GraduationCap className="h-5 w-5 card-title" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt><SmallText className="truncate card-title/70">Training Module</SmallText></dt>
              <dd><H4 className="card-title">
                Improve your skills
              </H4></dd>
            </dl>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div>
            <Link href="/training" className="font-sans text-sm font-medium card-title hover:text-purple-300 flex items-center">
              Start training <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
