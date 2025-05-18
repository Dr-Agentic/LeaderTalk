import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import RecordingSection from "@/components/RecordingSection";
import { H1, H2 } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </div>
        
        <H1>Record a Conversation</H1>
        <p className="text-muted-foreground mt-2 mb-6">
          Record your conversations to get AI-powered insights on your communication style.
        </p>
        
        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardContent className="pt-6">
              <RecordingSection onRecordingComplete={handleRecordingComplete} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}