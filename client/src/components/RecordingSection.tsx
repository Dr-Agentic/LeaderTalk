import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { apiRequest } from "@/lib/queryClient";
import { Mic, Pause, Play, OctagonMinus } from "lucide-react";

export default function RecordingSection({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [detectSpeakers, setDetectSpeakers] = useState(true);
  const [createTranscript, setCreateTranscript] = useState(true);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const timerRef = useRef(null);
  const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds
  
  const { 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording, 
    recordingBlob
  } = useRecording();
  
  // Handle recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          const progress = (newTime / MAX_RECORDING_TIME) * 100;
          setRecordingProgress(progress);
          
          // Automatically stop recording if it reaches max time
          if (newTime >= MAX_RECORDING_TIME) {
            handleStopRecording();
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle start recording
  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
      setIsPaused(false);
      toast({
        title: "Recording started",
        description: "Your conversation is now being recorded.",
      });
    } catch (error) {
      toast({
        title: "Error starting recording",
        description: "Please ensure your microphone is connected and permissions are granted.",
        variant: "destructive",
      });
    }
  };
  
  // Handle pause/resume recording
  const handlePauseResumeRecording = async () => {
    if (isPaused) {
      await resumeRecording();
      setIsPaused(false);
    } else {
      await pauseRecording();
      setIsPaused(true);
    }
  };
  
  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      await stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setShowTitleDialog(true);
    } catch (error) {
      toast({
        title: "Error stopping recording",
        description: "There was an issue stopping the recording.",
        variant: "destructive",
      });
    }
  };
  
  // Handle save recording
  const handleSaveRecording = async () => {
    if (!recordingTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your recording.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create a new recording entry
      const createRes = await apiRequest('POST', '/api/recordings', {
        title: recordingTitle,
        duration: recordingTime,
      });
      
      const recording = await createRes.json();
      
      if (!recordingBlob) {
        throw new Error("No recording data available");
      }
      
      // Upload the audio file for analysis
      const formData = new FormData();
      
      // Check for supported formats (OpenAI API requires specific formats)
      const mimeType = recordingBlob.type;
      const fileExtension = mimeType === 'audio/mp3' ? 'mp3' : 
                           mimeType === 'audio/wav' ? 'wav' : 
                           mimeType === 'audio/mpeg' ? 'mp3' : 'webm';
                           
      console.log(`Uploading audio file with MIME type: ${mimeType} and extension: ${fileExtension}`);
      
      formData.append("audio", recordingBlob, `recording.${fileExtension}`);
      formData.append("recordingId", recording.id.toString());
      formData.append("detectSpeakers", detectSpeakers.toString());
      formData.append("createTranscript", createTranscript.toString());
      
      const uploadRes = await fetch('/api/recordings/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!uploadRes.ok) {
        throw new Error("Failed to upload recording");
      }
      
      toast({
        title: "Recording saved",
        description: "Your recording has been saved and is being analyzed.",
      });
      
      // Reset state
      setRecordingTime(0);
      setRecordingProgress(0);
      setShowTitleDialog(false);
      setRecordingTitle("");
      
      if (onRecordingComplete) {
        onRecordingComplete(recording);
      }
    } catch (error) {
      toast({
        title: "Error saving recording",
        description: "There was an issue saving your recording.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div id="record-section" className="mt-10">
      <h2 className="text-lg font-medium text-gray-900">Record a Conversation</h2>
      
      <div className="mt-4 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-6">
            {/* Recording Button */}
            <button
              className={`inline-flex items-center justify-center h-32 w-32 rounded-full ${
                isRecording
                  ? isPaused
                    ? "bg-yellow-500 text-white"
                    : "bg-red-600 text-white"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              } mb-4 border-2 ${
                isRecording
                  ? isPaused
                    ? "border-yellow-600"
                    : "border-red-700"
                  : "border-red-200"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              onClick={!isRecording ? handleStartRecording : () => {}}
            >
              <Mic className="h-12 w-12" />
            </button>
            
            <h3 className="text-lg font-medium text-gray-900 mt-4">
              {isRecording ? (
                isPaused ? "Recording Paused" : "Recording in Progress"
              ) : (
                "Start Recording"
              )}
            </h3>
            
            <p className="mt-1 text-sm text-gray-500">
              {isRecording ? (
                `${formatTime(recordingTime)} / 50:00`
              ) : (
                "Click to start recording your conversation.\nLeaderTalk will analyze your communication patterns."
              )}
            </p>
            
            {/* Recording Controls */}
            {isRecording && (
              <div className="mt-8">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant={isPaused ? "default" : "destructive"}
                    size="sm"
                    onClick={handlePauseResumeRecording}
                    className="w-24"
                  >
                    {isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleStopRecording}
                    className="w-24"
                  >
                    <OctagonMinus className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </div>
                
                <div className="mt-6 max-w-xl mx-auto">
                  <Progress value={recordingProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0:00</span>
                    <span>50:00</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Settings */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detect-speakers" 
                    checked={detectSpeakers}
                    onCheckedChange={setDetectSpeakers}
                    disabled={isRecording}
                  />
                  <Label htmlFor="detect-speakers" className="text-sm text-gray-600">
                    Auto-detect speakers
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="transcribe" 
                    checked={createTranscript}
                    onCheckedChange={setCreateTranscript}
                    disabled={isRecording}
                  />
                  <Label htmlFor="transcribe" className="text-sm text-gray-600">
                    Create transcript
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Title Dialog */}
      <Dialog open={showTitleDialog} onOpenChange={setShowTitleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Recording</DialogTitle>
            <DialogDescription>
              Give your recording a descriptive title to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Team Meeting Discussion"
                className="col-span-3"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveRecording}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Save Recording"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
