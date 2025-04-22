import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnalysisInstance, Recording, AnalysisResult } from "../../../shared/schema";

// Type for query data from API
interface RecordingWithAnalysis extends Omit<Recording, 'analysisResult'> {
  // This field will be populated from the recording's analysisResult field
  analysis: AnalysisResult | null;
}

export default function TranscriptView() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const recordingId = parseInt(params.id);
  
  // Query for recording details including transcription and analysis
  const { data: recording, isLoading } = useQuery<RecordingWithAnalysis>({
    queryKey: ['/api/recordings', recordingId],
    queryFn: async ({ queryKey }) => {
      const [url, id] = queryKey;
      const response = await fetch(`${url}/${id}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Network response was not ok");
      }
      
      // Get the recording data
      const data = await response.json();
      
      // Transform the data to match our component needs
      // Map analysisResult to analysis for easier use in our component
      return {
        ...data,
        analysis: data.analysisResult
      };
    },
    enabled: !isNaN(recordingId),
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!recording) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Recording Not Found</h1>
          <p className="mb-6">The requested recording could not be found.</p>
          <BackButton to="/transcripts" label="Back to All Transcripts" className="mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <BackButton 
          to="/transcripts" 
          label="Back to All Transcripts" 
          className="mr-2"
        />
        <h1 className="text-2xl font-bold">{recording.title} - Transcript</h1>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Transcript Analysis</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Positive Communication
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Negative Communication
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Needs Improvement
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recording.transcription ? (
            <TranscriptWithHighlighting
              transcription={recording.transcription}
              analysis={recording.analysis}
            />
          ) : (
            <p className="text-gray-500 italic">No transcript available for this recording.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Positive Moments</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisInstancesList
              instances={recording.analysis?.positiveInstances || []}
              emptyMessage="No positive communication moments identified."
              type="positive"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Negative Moments</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisInstancesList
              instances={recording.analysis?.negativeInstances || []}
              emptyMessage="No negative communication moments identified."
              type="negative"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-gray-600">Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisInstancesList
            instances={recording.analysis?.passiveInstances || []}
            emptyMessage="No passive communication moments identified."
            type="passive"
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface TranscriptProps {
  transcription: string;
  analysis: AnalysisResult | null;
}

function TranscriptWithHighlighting({ transcription, analysis }: TranscriptProps) {
  // If no analysis, return plain text
  if (!analysis) {
    return <p className="whitespace-pre-line">{transcription}</p>;
  }
  
  // Extract the instances from the analysis
  const positiveInstances = analysis.positiveInstances || [];
  const negativeInstances = analysis.negativeInstances || [];
  const passiveInstances = analysis.passiveInstances || [];
  
  // If no transcript or instances, return plain text
  if (!transcription || (!positiveInstances.length && !negativeInstances.length && !passiveInstances.length)) {
    return <p className="whitespace-pre-line">{transcription}</p>;
  }
  
  // Function to highlight text
  const getColoredTranscript = () => {
    let result = transcription;
    
    // First, we need to sort all instances by the length of their text (longest first)
    // This prevents shorter matches from breaking longer ones
    const allInstances = [
      ...positiveInstances.map((i) => ({ ...i, type: 'positive' as const })),
      ...negativeInstances.map((i) => ({ ...i, type: 'negative' as const })),
      ...passiveInstances.map((i) => ({ ...i, type: 'passive' as const }))
    ].sort((a, b) => b.text.length - a.text.length);
    
    // Map of instance text to type
    const instanceMap = new Map();
    allInstances.forEach(instance => {
      instanceMap.set(instance.text, instance.type);
    });
    
    // Create HTML with spans for highlighting
    for (const instance of allInstances) {
      const { text, type } = instance;
      if (!text || typeof text !== 'string') continue;
      
      // Escape regex special characters
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create CSS class based on type
      let cssClass = '';
      if (type === 'positive') {
        cssClass = 'bg-green-100 text-green-800 px-1 rounded';
      } else if (type === 'negative') {
        cssClass = 'bg-red-100 text-red-800 px-1 rounded';
      } else if (type === 'passive') {
        cssClass = 'bg-gray-100 text-gray-800 px-1 rounded';
      }
      
      // Replace text with highlighted version
      const regex = new RegExp(escapedText, 'g');
      result = result.replace(regex, `<span class="${cssClass}">${text}</span>`);
    }
    
    return result;
  };
  
  // Get the highlighted transcript
  const highlightedTranscript = getColoredTranscript();
  
  return (
    <div className="prose prose-sm max-w-none whitespace-pre-line">
      <div dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
    </div>
  );
}

interface AnalysisInstancesListProps {
  instances: AnalysisInstance[];
  emptyMessage: string;
  type: 'positive' | 'negative' | 'passive';
}

function AnalysisInstancesList({ instances, emptyMessage, type }: AnalysisInstancesListProps) {
  if (!instances.length) {
    return <p className="text-gray-500 italic">{emptyMessage}</p>;
  }
  
  return (
    <div className="space-y-4">
      {instances.map((instance, index) => (
        <div key={index} className="pb-3">
          <p className="font-medium mb-1">
            <span
              className={`${
                type === 'positive'
                  ? 'bg-green-100 text-green-800'
                  : type === 'negative'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              } px-1 py-0.5 rounded`}
            >
              "{instance.text}"
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {formatTimestamp(instance.timestamp)}
            </span>
          </p>
          <p className="text-sm text-gray-700 ml-2">{instance.analysis}</p>
          {instance.improvement && (
            <p className="text-sm text-blue-600 ml-2 mt-1">
              <strong>Suggestion:</strong> {instance.improvement}
            </p>
          )}
          {index < instances.length - 1 && <Separator className="mt-3" />}
        </div>
      ))}
    </div>
  );
}

// Utility function to format timestamp in mm:ss format
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}