import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Audio } from 'expo-av';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function Recording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    // Set up audio mode
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    };
    
    setupAudio();
    
    // Timer for recording duration
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Request permissions if needed
      if (!permissionResponse?.granted) {
        await requestPermission();
      }
      
      // Reset duration
      setDuration(0);
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      // In a real app, you would upload the recording to your server
      console.log('Recording stopped and stored at', uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Record Conversation
      </ThemedText>
      
      <ThemedText style={styles.instructions}>
        Record your conversation to receive AI-powered analysis of your communication patterns.
      </ThemedText>
      
      <View style={styles.recordingContainer}>
        {isRecording ? (
          <ThemedText type="subtitle" style={styles.timer}>
            {formatTime(duration)}
          </ThemedText>
        ) : (
          <ThemedText style={styles.readyText}>
            Ready to record
          </ThemedText>
        )}
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingActive : null
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <IconSymbol
            name={isRecording ? "stop.fill" : "mic.fill"}
            size={32}
            color="#ffffff"
          />
        </TouchableOpacity>
        
        <ThemedText style={styles.hintText}>
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </ThemedText>
      </View>
      
      <ThemedView style={styles.infoCard}>
        <ThemedText type="defaultSemiBold">Tips for best results:</ThemedText>
        <ThemedText style={styles.tipText}>
          • Record in a quiet environment
        </ThemedText>
        <ThemedText style={styles.tipText}>
          • Speak clearly and at a normal pace
        </ThemedText>
        <ThemedText style={styles.tipText}>
          • Keep the phone close to the conversation
        </ThemedText>
        <ThemedText style={styles.tipText}>
          • Recordings can be up to 50 minutes long
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginVertical: 16,
    textAlign: 'center',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 40,
  },
  recordingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  timer: {
    fontSize: 48,
    marginBottom: 24,
  },
  readyText: {
    marginBottom: 24,
    opacity: 0.7,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0070f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingActive: {
    backgroundColor: '#f44336',
  },
  hintText: {
    opacity: 0.7,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipText: {
    marginTop: 8,
  },
});
