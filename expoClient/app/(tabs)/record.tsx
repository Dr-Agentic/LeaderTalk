import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { uploadRecording } from '@/src/services/recordingService';
import { router } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';

export default function RecordScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  useEffect(() => {
    // Request permissions when component mounts
    if (!permissionResponse) {
      requestPermission();
    }
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (!permissionResponse?.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant microphone permission to record audio",
          [{ text: "OK", onPress: requestPermission }]
        );
        return;
      }
      
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        return;
      }
      
      setIsRecording(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        console.log('Recording saved at', uri);
        Alert.alert(
          'Recording Complete',
          'Your recording has been saved. Would you like to upload and analyze it?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upload & Analyze', onPress: () => handleUploadRecording(uri) }
          ]
        );
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleUploadRecording = async (uri: string) => {
    try {
      setIsUploading(true);
      
      const result = await uploadRecording(uri, `Recording ${new Date().toLocaleString()}`);
      
      Alert.alert(
        'Upload Successful',
        'Your recording has been uploaded and is being analyzed. You can view it in your recordings.',
        [
          { text: 'View Recordings', onPress: () => router.push('/recordings') },
          { text: 'Record Another', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload your recording. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Record Conversation</ThemedText>
        <ThemedText style={styles.subtitle}>
          Record your conversation to get feedback on your communication style
        </ThemedText>
      </View>
      
      <ThemedView style={styles.recordingContainer}>
        {isRecording ? (
          <View style={styles.recordingInfo}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <ThemedText style={styles.recordingText}>Recording</ThemedText>
            </View>
            <ThemedText style={styles.timer}>{formatTime(recordingDuration)}</ThemedText>
            <ThemedText style={styles.maxDuration}>Max: 50:00</ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.instructions}>
            Tap the button below to start recording your conversation.
            You can record up to 50 minutes.
          </ThemedText>
        )}
        
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingActive : null
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <FontAwesome
            name={isRecording ? 'stop' : 'microphone'}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
        
        {isRecording && (
          <ThemedText style={styles.tapToStop}>
            Tap to stop recording
          </ThemedText>
        )}
      </ThemedView>
      
      <ThemedView style={styles.tipsCard}>
        <ThemedText type="subtitle">Recording Tips</ThemedText>
        <View style={styles.tipItem}>
          <FontAwesome name="check-circle" size={16} color="#0070f3" />
          <ThemedText style={styles.tipText}>
            Find a quiet environment with minimal background noise
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <FontAwesome name="check-circle" size={16} color="#0070f3" />
          <ThemedText style={styles.tipText}>
            Place your device close to you and other speakers
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <FontAwesome name="check-circle" size={16} color="#0070f3" />
          <ThemedText style={styles.tipText}>
            Speak clearly and at a normal pace
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginVertical: 16,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0070f3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recordingActive: {
    backgroundColor: '#f44336',
  },
  recordingInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f44336',
    marginRight: 8,
  },
  recordingText: {
    color: '#f44336',
    fontWeight: '600',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  maxDuration: {
    opacity: 0.7,
  },
  tapToStop: {
    marginTop: 16,
    opacity: 0.7,
  },
  tipsCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  tipText: {
    marginLeft: 8,
    flex: 1,
  },
});
