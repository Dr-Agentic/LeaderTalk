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

function calculateWeeklyImprovement(recordings: any) {
  if (!recordings || recordings.length === 0) return 0;
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeek = recordings.filter((r: any) => new Date(r.createdAt) >= oneWeekAgo);
  const lastWeek = recordings.filter((r: any) => {
    const date = new Date(r.createdAt);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });
  
  const thisWeekAvg = thisWeek.length > 0 
    ? thisWeek.reduce((sum: number, r: any) => sum + (r.analysisResult?.overallScore || 0), 0) / thisWeek.length 
    : 0;
  const lastWeekAvg = lastWeek.length > 0 
    ? lastWeek.reduce((sum: number, r: any) => sum + (r.analysisResult?.overallScore || 0), 0) / lastWeek.length 
    : 0;
  
  return lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;
}

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
  
  const lastRecording = recordingsData && Array.isArray(recordingsData) && recordingsData.length > 0 
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
      <div className="p-6 space-y-8">
        {/* Hero Section with template styling */}
        <div className="hero-section p-8">
          <div className="hero-content">
            <h1 className="hero-title">Welcome back, {(user as any)?.username || 'Leader'}</h1>
            <p className="hero-subtitle">
              Continue your leadership journey and unlock your potential through AI-powered coaching
            </p>
            <button 
              onClick={() => navigate('/training')}
              className="cta-button px-8 py-4 text-lg"
            >
              Start Your Journey
            </button>
          </div>
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
            recordingsCount={Array.isArray(recordingsData) ? recordingsData.length : 0}
            weeklyImprovement={calculateWeeklyImprovement(recordingsData)}
          />
          
          {lastRecording && lastRecording.analysisResult && (
            <AnalysisDisplay 
              recording={lastRecording}
              leaders={leaderData}
            />
          )}
          
          <Card className="mt-8 bg-gradient-to-br from-purple-600/20 to-pink-500/20 backdrop-blur-lg border border-purple-600/30">
            <CardContent className="pt-6">
              <H2 className="text-white">Record a Conversation</H2>
              <Paragraph className="mt-2 mb-4 text-white/70">
                Record your conversations to get AI-powered insights on your communication style.
              </Paragraph>
              
              <Button 
                className="mt-2 flex items-center bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600" 
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
          <Skeleton key={i} className="h-48 rounded-lg bg-white/10" />
        ))}
      </div>
      
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-32 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}