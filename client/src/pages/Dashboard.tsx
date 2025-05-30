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
  
  const { data: user } = useQuery({
    queryKey: ['/api/users/me'],
  });
  
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
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{Array.isArray(leaderData) ? leaderData.length : 0}</div>
              <div className="text-sm text-white/60 uppercase tracking-wider">Leaders</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{Array.isArray(recordingsData) ? recordingsData.length : 0}</div>
              <div className="text-sm text-white/60 uppercase tracking-wider">Sessions</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{recordingsData && Array.isArray(recordingsData) && recordingsData.length > 0 ? Math.round((recordingsData.length / 10) * 100) : 0}%</div>
              <div className="text-sm text-white/60 uppercase tracking-wider">Progress</div>
            </div>
          </div>

          {/* Featured Training Cards */}
          <h2 className="section-title">Featured Training</h2>
          <div className="cards-container">
            <div className="glass-card cursor-pointer" onClick={() => navigate('/training')}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🚀</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Innovation Leadership</h3>
                  <p className="text-white/70">Master the art of leading through change and driving innovation in your organization</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card cursor-pointer" onClick={() => navigate('/leadership-inspirations')}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎯</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Leadership Inspirations</h3>
                  <p className="text-white/70">Explore different leadership styles and learn from industry pioneers</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card cursor-pointer" onClick={() => navigate('/transcripts')}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">📈</div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Progress Analytics</h3>
                  <p className="text-white/70">Review your past sessions and track your communication improvements</p>
                </div>
              </div>
            </div>
          </div>

          {showQuote && (
            <div className="transition-all duration-500 ease-in-out transform" 
                 style={{ opacity: showQuote ? 1 : 0 }}>
              <QuoteDisplay />
            </div>
          )}
        </>
      )}
      </div>
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