import { useState } from "react";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import QuickActions from "@/components/dashboard/QuickActions";
import AnalysisDisplay from "@/components/dashboard/AnalysisDisplay";
import RecordingSection from "@/components/RecordingSection";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { H1, H2, Lead, Paragraph } from "@/components/ui/typography";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/users/me'],
  });
  
  const { data: recordingsData, isLoading: recordingsLoading } = useQuery({
    queryKey: ['/api/recordings'],
  });
  
  const { data: leaderData, isLoading: leadersLoading } = useQuery({
    queryKey: ['/api/leaders'],
  });
  
  const isLoading = userLoading || recordingsLoading || leadersLoading;
  
  const lastRecording = recordingsData && recordingsData.length > 0 
    ? recordingsData[0] 
    : null;
    
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        user={userData}
      />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <MobileHeader setSidebarOpen={setSidebarOpen} user={userData} />
        
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div id="dashboard" className="px-4 sm:px-6 md:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
                  
                  <RecordingSection 
                    onRecordingComplete={(recording) => {
                      toast({
                        title: "Recording Complete",
                        description: `Your recording "${recording.title}" is being analyzed.`,
                      });
                      
                      // Force a refetch of recordings and word usage data
                      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/usage/words'] });
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
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
