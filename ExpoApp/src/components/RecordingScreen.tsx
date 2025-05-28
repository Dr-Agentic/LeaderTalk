import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRecording } from '../hooks/useRecording';
import { useMicrophonePermission } from '../hooks/useMicrophonePermission';
import { apiRequest } from '../lib/api';
import { Recording } from '../types';
import { ProgressBar, Checkbox, Button } from 'react-native-paper';

export default function RecordingScreen() {
  const navigation = useNavigation();
  const [recordingTitle, setRecordingTitle] = useState('');
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectSpeakers, setDetectSpeakers] = useState(true);
  const [createTranscript, setCreateTranscript] = useState(true);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds

  const { 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording, 
    recordingUri, 
    isRecording, 
    isPaused, 
    duration 
  } = useRecording();

  const { permissionStatus, requestPermission, isDenied } = useMicrophonePermission();

  // Update progress bar
  useEffect(() => {
    if (isRecording) {
      const progress = (duration / MAX_RECORDING_TIME) * 100;
      setRecordingProgress(progress);
    }
  }, [duration, isRecording]);

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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

  // Handle start recording
  const handleStartRecording = async () => {
    if (isRecording) return;

    try {
      // Check if permission is denied
      if (isDenied) {
        Alert.alert(
          'Microphone Access Denied',
          'Please allow microphone access in your device settings and try again.'
        );
        return;
      }

      await startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert(
        'Error Starting Recording',
        'Please ensure your microphone is connected and permissions are granted.'
      );
    }
  };

  // Handle pause/resume recording
  const handlePauseResumeRecording = async () => {
    if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      await stopRecording();
      setRecordingTitle(generateDefaultTitle());
      setShowTitleDialog(true);
    } catch (error) {
      Alert.alert(
        'Error Stopping Recording',
        'There was an issue stopping the recording.'
      );
    }
  };

  // Handle save recording
  const handleSaveRecording = async () => {
    if (!recordingTitle.trim()) {
      Alert.alert('Title Required', 'Please provide a title for your recording.');
      return;
    }

    setIsProcessing(true);

    try {
      // Create a new recording entry
      const recording = await apiRequest<Recording>('POST', '/api/recordings', {
        title: recordingTitle,
        duration: duration,
      });

      if (!recordingUri) {
        throw new Error('No recording data available');
      }

      // Upload the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: recordingUri,
        name: `recording_${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);
      formData.append('recordingId', recording.id.toString());
      formData.append('detectSpeakers', detectSpeakers.toString());
      formData.append('createTranscript', createTranscript.toString());

      const response = await fetch('https://your-api-url.com/api/recordings/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      // Reset state
      setShowTitleDialog(false);
      setRecordingTitle('');
      setRecordingProgress(0);

      // Navigate to transcript view
      navigation.navigate('TranscriptView', { id: recording.id });
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert(
        'Error Saving Recording',
        'There was an issue saving your recording. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record a Conversation</Text>
      <Text style={styles.subtitle}>
        Record your conversations to get AI-powered insights on your communication style.
      </Text>

      <View style={styles.recordingContainer}>
        {/* Recording Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording
              ? isPaused
                ? styles.pausedButton
                : styles.activeButton
              : styles.inactiveButton,
          ]}
          onPress={!isRecording ? handleStartRecording : undefined}
        >
          <MaterialIcons
            name="mic"
            size={48}
            color={isRecording ? 'white' : '#e53e3e'}
          />
        </TouchableOpacity>

        <Text style={styles.recordingStatus}>
          {isRecording
            ? isPaused
              ? 'Recording Paused'
              : 'Recording in Progress'
            : 'Start Recording'}
        </Text>

        <Text style={styles.recordingTime}>
          {isRecording
            ? `${formatTime(duration)} / 50:00`
            : 'Click to start recording your conversation.\nLeaderTalk will analyze your communication patterns.'}
        </Text>

        {/* Microphone permission warning */}
        {isDenied && !isRecording && (
          <View style={styles.warningContainer}>
            <MaterialIcons name="error" size={16} color="#e53e3e" />
            <Text style={styles.warningText}>
              Microphone access denied. Please enable it in your device settings to record conversations.
            </Text>
          </View>
        )}

        {/* Recording Controls */}
        {isRecording && (
          <View style={styles.controlsContainer}>
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handlePauseResumeRecording}
                style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                icon={isPaused ? 'play' : 'pause'}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleStopRecording}
                style={styles.controlButton}
                icon="stop"
              >
                Stop
              </Button>
            </View>

            <View style={styles.progressContainer}>
              <ProgressBar progress={recordingProgress / 100} color="#e53e3e" style={styles.progressBar} />
              <View style={styles.timeLabels}>
                <Text style={styles.timeLabel}>0:00</Text>
                <Text style={styles.timeLabel}>50:00</Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={detectSpeakers ? 'checked' : 'unchecked'}
              onPress={() => setDetectSpeakers(!detectSpeakers)}
              disabled={isRecording}
            />
            <Text style={styles.checkboxLabel}>Auto-detect speakers</Text>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={createTranscript ? 'checked' : 'unchecked'}
              onPress={() => setCreateTranscript(!createTranscript)}
              disabled={isRecording}
            />
            <Text style={styles.checkboxLabel}>Create transcript</Text>
          </View>
        </View>
      </View>

      {/* Title Dialog */}
      <Modal
        visible={showTitleDialog}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTitleDialog(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Name Your Recording</Text>
            <Text style={styles.modalSubtitle}>
              Give your recording a descriptive title to help you identify it later.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Team Meeting Discussion"
              value={recordingTitle}
              onChangeText={setRecordingTitle}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowTitleDialog(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveRecording}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.modalButton}
              >
                {isProcessing ? 'Processing...' : 'Save Recording'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  recordingContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  inactiveButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  activeButton: {
    backgroundColor: '#e53e3e',
    borderColor: '#dc2626',
  },
  pausedButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  recordingStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#b91c1c',
    marginLeft: 8,
    flex: 1,
  },
  controlsContainer: {
    width: '100%',
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  controlButton: {
    marginHorizontal: 8,
    minWidth: 100,
  },
  pauseButton: {
    backgroundColor: '#e53e3e',
  },
  resumeButton: {
    backgroundColor: '#059669',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingsContainer: {
    width: '100%',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
});
