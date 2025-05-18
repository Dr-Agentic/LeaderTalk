import { Link, useLocation } from "wouter";
import QuickActions from "@/components/dashboard/QuickActions";
import AnalysisDisplay from "@/components/dashboard/AnalysisDisplay";
import { QuoteDisplay } from "@/components/dashboard/QuoteDisplay";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Mic } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { H1, H2, Lead, Paragraph } from "@/components/ui/typography";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showQuote, setShowQuote] = useState(true);
  
  const { data: recordingsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['/api/recordings'],
  });
  
  const { data: leaderData, isLoading: leadersLoading } = useQuery({
    queryKey: ['/api/leaders'],
  });
  
  const isLoading = recordingsLoading || leadersLoading;
  
  const lastRecording = recordingsData && recordingsData.length > 0 
    ? recordingsData[0] 
    : null;
    
  // Auto-hide quote after 10 seconds
  useEffect(() => {
    if (showQuote) {
      const timer = setTimeout(() => {
        setShowQuote(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showQuote]);
    
  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <H1>Dashboard</H1>
        <Link href="/transcripts" className="mt-2 sm:mt-0 inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark">
          View all transcripts
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {showQuote && (
            <div className="transition-all duration-500 ease-in-out transform" 
                 style={{ opacity: showQuote ? 1 : 0 }}>
              <QuoteDisplay />
            </div>
          )}
          
          <QuickActions 
            recordingsCount={recordingsData?.length || 0}
            weeklyImprovement={calculateWeeklyImprovement(recordingsData)}
          />
          
          {lastRecording && lastRecording.analysisResult && (
            <AnalysisDisplay 
              recording={lastRecording}
              leaders={leaderData}
            />
          )}
          
          <Card className="mt-8">
            <CardContent className="pt-6">
              <H2>Record a Conversation</H2>
              <Paragraph className="mt-2 mb-4">
                Record your conversations to get AI-powered insights on your communication style.
              </Paragraph>
              
              <Button 
                className="mt-2 flex items-center" 
                size="lg"
                onClick={() => navigate('/recording')}
                variant="default"
              >
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </AppLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
      
      {/* Analysis display skeleton */}
      <Skeleton className="h-96 rounded-lg" />
      
      {/* Recording section skeleton */}
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}

function calculateWeeklyImprovement(recordings) {
  if (!recordings || recordings.length < 2) return 0;
  
  // This is a simplified calculation for demonstration
  // In a real app, you would do a more sophisticated analysis
  const recentRecordings = recordings.slice(0, 2);
  
  if (recentRecordings[0].analysisResult?.overview?.score && 
      recentRecordings[1].analysisResult?.overview?.score) {
    const recent = recentRecordings[0].analysisResult.overview.score;
    const previous = recentRecordings[1].analysisResult.overview.score;
    
    if (recent > previous) {
      return Math.round(((recent - previous) / previous) * 100);
    }
  }
  
  return 0;
}
