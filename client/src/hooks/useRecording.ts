import { useState, useRef, useCallback } from "react";

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Start recording
  const startRecording = useCallback(async () => {
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      // Try to use a supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/mp3') 
        ? 'audio/mp3' 
        : MediaRecorder.isTypeSupported('audio/wav') 
          ? 'audio/wav' 
          : 'audio/webm';
      
      console.log("Using MIME type for recording:", mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // 128 kbps
      });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener("dataavailable", event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener("stop", () => {
        // Use mp3 format which is supported by OpenAI
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        setRecordingBlob(audioBlob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      });
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }, []);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      try {
        if (mediaRecorderRef.current && isRecording) {
          // Add event listener for when recording stops
          mediaRecorderRef.current.addEventListener("stop", () => {
            setIsRecording(false);
            setIsPaused(false);
            resolve();
          }, { once: true });
          
          mediaRecorderRef.current.stop();
        } else {
          resolve();
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
        reject(error);
      }
    });
  }, [isRecording]);
  
  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);
  
  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);
  
  return {
    isRecording,
    isPaused,
    recordingBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
}
