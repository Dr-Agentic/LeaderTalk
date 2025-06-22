import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import RecordingSection from "@/components/RecordingSection";
import { H1, H2 } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";

export default function Recording() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const handleRecordingComplete = (recording) => {
    // Invalidate the recordings query to refresh the dashboard
    queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
    // Navigate to the transcript view
    navigate(`/transcript/${recording.id}`);
  };
  
  return (
    <AppLayout 
      showBackButton={true}
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="Record a Conversation"
    >
      <div className="page-container content-spacing">
        <H1>Record a Conversation</H1>
        <p className="card-description mt-2 mb-6">
          Record your conversations to get AI-powered insights on your communication style.
        </p>
        
        <div className="space-y-xl">
          <Card className="glass-card">
            <CardContent className="content-padding">
              <RecordingSection onRecordingComplete={handleRecordingComplete} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}