import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { useMicrophonePermission } from "@/hooks/useMicrophonePermission";
import { apiRequest } from "@/lib/queryClient";
import { H2, Paragraph } from "@/components/ui/typography";
import { Mic, Pause, Play, OctagonMinus, AlertCircle } from "lucide-react";
import { WordLimitExceededMessage } from "@/components/WordLimitMessages";
import { useQuery } from "@tanstack/react-query";

interface RecordingSectionProps {
  onRecordingComplete: (recording: any) => void;
}

export default function RecordingSection({ onRecordingComplete }: RecordingSectionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [detectSpeakers, setDetectSpeakers] = useState(true);
  const [createTranscript, setCreateTranscript] = useState(true);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Query for checking word limits from Stripe
  const { data: wordUsageData, isLoading: isCheckingWordLimit } = useQuery<{
    currentUsage: number;
    wordLimit: number;
    usagePercentage: number;
    hasExceededLimit: boolean;
  }>({
    queryKey: ['/api/users/word-usage'],
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Determine if user has exceeded their word limit
  const hasExceededWordLimit = wordUsageData?.hasExceededLimit || false;
  
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);
  const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds
  
  // Use our microphone permission hook to manage mic access
  const { 
    permissionStatus, 
    requestPermission, 
    isDenied 
  } = useMicrophonePermission();
  
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
      // Need to use non-null assertion because TypeScript doesn't know setInterval returns number in browser
      timerRef.current = window.setInterval(() => {
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
      }, 1000) as unknown as number;
    } else {
      if (timerRef.current !== null) {
        const id = timerRef.current;
        window.clearInterval(id);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current !== null) {
        const id = timerRef.current;
        window.clearInterval(id);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused]);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Request mic permission early if we don't have it yet
  useEffect(() => {
    // If permission status is prompt, we can ask for permission proactively
    // This will make sure we only prompt once instead of every recording
    if (permissionStatus === 'prompt') {
      requestPermission().catch(err => {
        console.error("Error requesting initial microphone permission:", err);
      });
    }
  }, [permissionStatus, requestPermission]);

  // Handle start recording
  const handleStartRecording = async () => {
    if (isRecording) {
      return; // Already recording, do nothing
    }
    
    // Check if the user has exceeded their word limit
    if (hasExceededWordLimit) {
      toast({
        title: "Word limit exceeded",
        description: "You've reached your monthly word limit. Please upgrade your subscription to continue.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if permission is denied
      if (isDenied) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser settings and try again.",
          variant: "destructive",
        });
        return;
      }
      
      await startRecording();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setRecordingProgress(0);
      toast({
        title: "Recording started",
        description: "Your conversation is now being recorded.",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
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
  // Generate a default recording title with current date and time
  const generateDefaultTitle = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `Recording-${year}-${month}-${day}-${hours}:${minutes}`;
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      
      // Set a default title with date and time format
      setRecordingTitle(generateDefaultTitle());
      
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
      
      // Validate the audio blob before uploading
      if (recordingBlob.size === 0) {
        throw new Error("Recording is empty (0 bytes). Please try again.");
      }
      
      if (recordingBlob.size < 1000) { // Less than 1KB is suspiciously small
        console.warn(`Warning: Very small recording (${recordingBlob.size} bytes), might be corrupted`);
        toast({
          title: "Warning",
          description: "The recording is very small and might be incomplete. Continuing anyway.",
          variant: "destructive",
        });
      }
      
      console.log(`Preparing to upload audio: ${recordingBlob.size} bytes, type: ${recordingBlob.type}`);
      
      // Check for supported formats (OpenAI API requires specific formats)
      const mimeType = recordingBlob.type || 'audio/webm'; // Default to webm if type is empty
      
      // Map MIME types to appropriate file extensions for OpenAI
      const fileExtensionMap = {
        'audio/mp3': 'mp3',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
        'audio/oga': 'ogg',
        'audio/m4a': 'm4a',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/aac': 'm4a'
      };
      
      // Use the mapped extension or default to 'webm' if unknown (this matches most browsers' MediaRecorder default)
      const fileExtension = Object.prototype.hasOwnProperty.call(fileExtensionMap, mimeType) 
        ? fileExtensionMap[mimeType as keyof typeof fileExtensionMap] 
        : 'webm';
      
      console.log(`Uploading audio file with MIME type: ${mimeType} and extension: ${fileExtension}`);
      
      // Add the file to the form with an appropriate extension
      formData.append("audio", recordingBlob, `recording_${Date.now()}.${fileExtension}`);
      formData.append("recordingId", recording.id.toString());
      formData.append("detectSpeakers", detectSpeakers.toString());
      formData.append("createTranscript", createTranscript.toString());
      
      // Capture upload start time for timing
      const uploadStartTime = Date.now();
      console.log("Starting audio upload", { recordingId: recording.id, size: recordingBlob.size });
      
      // Upload audio file with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        // Upload audio file
        const uploadRes = await fetch('/api/recordings/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        // Log timing information
        const uploadDuration = Date.now() - uploadStartTime;
        console.log(`Upload completed in ${uploadDuration}ms with status ${uploadRes.status}`);
        
        // Handle different response statuses
        if (!uploadRes.ok) {
          // Try to get detailed error information
          let errorMessage = `Server error: ${uploadRes.status} ${uploadRes.statusText}`;
          try {
            const errorData = await uploadRes.json();
            console.error("Upload error details:", errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error("Could not parse error response:", parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        // Process successful response
        try {
          const responseText = await uploadRes.text();
          if (responseText) {
            const responseData = JSON.parse(responseText);
            console.log("Upload response:", responseData);
          } else {
            console.log("Empty response with status:", uploadRes.status);
          }
        } catch (parseError) {
          console.warn("Could not parse response:", parseError);
          console.log("Response status:", uploadRes.status);
        }
      } catch (error) {
        // Clear the timeout if fetch failed
        clearTimeout(timeoutId);
        
        const fetchError = error as Error; // Type assertion for TypeScript
        
        if (fetchError.name === 'AbortError') {
          console.error("Upload timed out after 60 seconds");
          throw new Error("Upload timed out. Please try again with a shorter recording.");
        }
        
        console.error("Fetch error during upload:", fetchError);
        throw fetchError;
      }
      
      // Show success message
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
      console.error("Recording error:", error);
      
      // Generate more specific error messages based on the error type
      let errorTitle = "Error saving recording";
      let errorMessage = "There was an issue saving your recording.";
      let troubleshootingMessage = "Please check your microphone permissions and try again with a shorter recording.";
      
      // Add more detailed error message if available
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        
        // Provide specific error messages for common issues
        if (errorMessage.includes("timed out") || errorMessage.includes("timeout")) {
          errorTitle = "Upload timeout";
          errorMessage = "Your recording is too large or your connection is slow.";
          troubleshootingMessage = "Try recording a shorter segment or check your internet connection.";
        } else if (errorMessage.includes("network") || errorMessage.includes("offline") || errorMessage.includes("connection")) {
          errorTitle = "Network error";
          errorMessage = "Unable to connect to the server.";
          troubleshootingMessage = "Please check your internet connection and try again.";
        } else if (errorMessage.includes("format") || errorMessage.includes("corrupted") || errorMessage.includes("invalid")) {
          errorTitle = "Audio format error";
          errorMessage = "The recording format is not supported or the file is corrupted.";
          troubleshootingMessage = "Try using a different browser or restart your device and try again.";
        } else if (errorMessage.includes("empty") || errorMessage.includes("0 bytes")) {
          errorTitle = "Empty recording";
          errorMessage = "No audio data was captured during recording.";
          troubleshootingMessage = "Check that your microphone is working and not muted, then try again.";
        } else if (errorMessage.includes("permission") || errorMessage.includes("denied")) {
          errorTitle = "Microphone access denied";
          errorMessage = "The app doesn't have permission to use your microphone.";
          troubleshootingMessage = "Please enable microphone access in your browser settings.";
        }
      }
      
      // Log additional debug information
      console.debug("Recording error details:", {
        errorType: error instanceof Error ? error.name : typeof error,
        message: errorMessage,
        recordingTime,
        hasBlob: !!recordingBlob,
        blobSize: recordingBlob?.size || 0,
        blobType: recordingBlob?.type || 'unknown'
      });
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      
      // Show additional toast with troubleshooting help
      toast({
        title: "Troubleshooting",
        description: troubleshootingMessage,
        variant: "default",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div id="record-section" className="mt-10">
      <H2>Record a Conversation</H2>
      
      <div className="mt-4 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Show word limit exceeded warning if needed */}
          {hasExceededWordLimit && (
            <WordLimitExceededMessage />
          )}
          
          <div className="text-center py-6">
            {/* Recording Button - Disabled when word limit is exceeded */}
            <button
              className={`inline-flex items-center justify-center h-32 w-32 rounded-full ${
                isRecording
                  ? isPaused
                    ? "bg-yellow-500 text-white"
                    : "bg-red-600 text-white"
                  : hasExceededWordLimit
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-100 text-red-600 hover:bg-red-200"
              } mb-4 border-2 ${
                isRecording
                  ? isPaused
                    ? "border-yellow-600"
                    : "border-red-700"
                  : hasExceededWordLimit
                    ? "border-gray-300"
                    : "border-red-200"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              onClick={!isRecording && !hasExceededWordLimit ? handleStartRecording : () => {}}
              disabled={hasExceededWordLimit}
              title={hasExceededWordLimit ? "Word limit exceeded. Please upgrade your subscription to continue." : "Start recording"}
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
            
            {/* Microphone permission warning */}
            {isDenied && !isRecording && (
              <div className="mt-3 p-2 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  Microphone access denied. Please enable it in your browser settings to record conversations.
                </span>
              </div>
            )}
            
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
                    onCheckedChange={(checked) => setDetectSpeakers(checked === true)}
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
                    onCheckedChange={(checked) => setCreateTranscript(checked === true)}
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
