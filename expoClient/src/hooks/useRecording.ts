import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { requestMicrophonePermission, openAppSettings } from './usePermissions';

interface UseRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingUri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  getRecordingBlob: () => Promise<Blob | null>;
}

export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      // Validate microphone permissions first
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Microphone Permission Required',
          'LeaderTalk needs microphone access to record and analyze your communication for leadership coaching. Please enable microphone access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => openAppSettings() }
          ]
        );
        return;
      }

      console.log('🎤 Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎤 Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setIsPaused(false);
      
      console.log('🎤 Recording started successfully');
    } catch (error) {
      console.error('🎤 Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        console.log('🎤 No recording to stop');
        return;
      }

      console.log('🎤 Stopping recording...');
      await recordingRef.current.stopAndUnloadAsync();
      
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      setIsPaused(false);
      
      recordingRef.current = null;
      console.log('🎤 Recording stopped, URI:', uri);
    } catch (error) {
      console.error('🎤 Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const pauseRecording = async () => {
    try {
      if (!recordingRef.current || !isRecording) {
        console.log('🎤 No active recording to pause');
        return;
      }

      console.log('🎤 Pausing recording...');
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
      console.log('🎤 Recording paused');
    } catch (error) {
      console.error('🎤 Failed to pause recording:', error);
      Alert.alert('Error', 'Failed to pause recording.');
    }
  };

  const resumeRecording = async () => {
    try {
      if (!recordingRef.current || !isPaused) {
        console.log('🎤 No paused recording to resume');
        return;
      }

      console.log('🎤 Resuming recording...');
      await recordingRef.current.startAsync();
      setIsPaused(false);
      console.log('🎤 Recording resumed');
    } catch (error) {
      console.error('🎤 Failed to resume recording:', error);
      Alert.alert('Error', 'Failed to resume recording.');
    }
  };

  const getRecordingBlob = async (): Promise<Blob | null> => {
    if (!recordingUri) {
      console.log('🎤 No recording URI available');
      return null;
    }

    try {
      console.log('🎤 Converting recording to blob...');
      const response = await fetch(recordingUri);
      const blob = await response.blob();
      console.log('🎤 Recording converted to blob:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('🎤 Failed to convert recording to blob:', error);
      return null;
    }
  };

  return {
    isRecording,
    isPaused,
    recordingUri,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordingBlob,
  };
}
