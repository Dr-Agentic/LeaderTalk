import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface UseRecordingReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  recordingUri: string | null;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
}

export function useRecording(): UseRecordingReturn {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [recording, timer]);

  // Start recording
  const startRecording = async (): Promise<void> => {
    try {
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        throw new Error('Permission to access microphone was denied');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      // Create and prepare recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      
      // Start timer to track duration
      const intervalId = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      setTimer(intervalId);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  };

  // Stop recording
  const stopRecording = async (): Promise<void> => {
    try {
      if (!recording) {
        throw new Error('No active recording');
      }

      // Stop timer
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
      
      setRecordingUri(uri);
      setIsRecording(false);
      setIsPaused(false);
      setRecording(null);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  };

  // Pause recording (iOS only)
  const pauseRecording = async (): Promise<void> => {
    try {
      if (!recording) {
        throw new Error('No active recording');
      }

      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }

      await recording.pauseAsync();
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  };

  // Resume recording (iOS only)
  const resumeRecording = async (): Promise<void> => {
    try {
      if (!recording) {
        throw new Error('No active recording');
      }

      await recording.startAsync();
      setIsPaused(false);
      
      // Restart timer
      const intervalId = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      setTimer(intervalId);
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  };

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    recordingUri,
    isRecording,
    isPaused,
    duration,
  };
}
