import { useState, useRef, useCallback } from "react";
import { useMicrophonePermission } from "./useMicrophonePermission";

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { permissionStatus, requestPermission } = useMicrophonePermission();
  
  // Start recording
  const startRecording = useCallback(async () => {
    audioChunksRef.current = [];
    
    try {
      // First ensure we have microphone permission
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error("Microphone permission denied");
        }
      }
      
      // Now get the audio stream with quality options
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      // Try to use a format supported by OpenAI's Whisper API
      // https://platform.openai.com/docs/guides/speech-to-text/supported-formats
      // OpenAI supports: m4a, mp3, mp4, mpeg, mpga, wav, webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'  // Best for Chrome and Firefox
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'  
            : MediaRecorder.isTypeSupported('audio/mp3')
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
        // Ensure we have valid recorded data
        if (audioChunksRef.current.length === 0) {
          console.error("No audio chunks recorded");
          setRecordingBlob(null);
          
          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          return;
        }
        
        try {
          // Get recorder's MIME type or use a default compatible with OpenAI
          // OpenAI's Whisper API supports: m4a, mp3, mp4, mpeg, mpga, wav, webm
          const mimeType = mediaRecorder.mimeType || "audio/webm";
          
          // Log the MIME type we're using for the blob
          console.log("Uploading audio file with MIME type:", mimeType, "and extension: mp3");
          
          // Create blob with the recorder's MIME type
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          // Verify the blob has content and log details
          console.log(`Audio blob created with size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
          console.log(`Total audio chunks collected: ${audioChunksRef.current.length}`);
          
          if (audioBlob.size > 0) {
            // Log more details about larger blobs
            if (audioBlob.size > 1024) {
              console.log(`Audio blob is ${(audioBlob.size / 1024).toFixed(2)} KB in size`);
            } else {
              console.warn("Audio blob is very small (<1KB), may be corrupted or empty");
            }
            
            setRecordingBlob(audioBlob);
          } else {
            console.error("Created empty audio blob (0 bytes)");
            setRecordingBlob(null);
          }
        } catch (error) {
          console.error("Error creating audio blob:", error);
          setRecordingBlob(null);
        } finally {
          // Always stop tracks to release microphone
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        }
      });
      
      // Request data at regular intervals (100ms) to ensure we capture everything
      // This is critical - without this, the dataavailable event may not fire frequently enough
      mediaRecorder.start(100);
      
      console.log("Started MediaRecorder with 100ms timeslice for frequent data capture");
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
