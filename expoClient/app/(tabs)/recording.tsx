import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '../../src/components/ThemedText';
import { AppLayout } from '../../src/components/navigation/AppLayout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Switch } from '../../src/components/ui/Switch';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Modal } from '../../src/components/ui/Modal';
import { TextInput } from '../../src/components/ui/TextInput';

import { useRecording } from '../../src/hooks/useRecording';
import { useWordLimit } from '../../src/hooks/useWordLimit';
import { apiRequest, uploadFile } from '../../src/lib/apiService';

const { width: screenWidth } = Dimensions.get('window');
const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds

export default function RecordingScreen() {
  // Optional query client - only use if available
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    console.warn('QueryClient not available:', error);
    queryClient = null;
  }
  
  // Recording state
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [detectSpeakers, setDetectSpeakers] = useState(true);
  const [createTranscript, setCreateTranscript] = useState(true);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const {
    isRecording,
    isPaused,
    recordingUri,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordingBlob,
  } = useRecording();
  
  const {
    wordUsageData,
    isCheckingWordLimit,
    hasExceededWordLimit,
    currentUsage,
    wordLimit,
  } = useWordLimit();

  // Handle recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
    console.log('🎤 Recording start requested', {
      isRecording,
      hasExceededWordLimit,
    });

    if (isRecording) {
      console.log('🎤 Already recording, ignoring request');
      return;
    }

    // Check if the user has exceeded their word limit
    if (hasExceededWordLimit) {
      console.log('🎤 Recording blocked: word limit exceeded');
      Alert.alert(
        'Word limit exceeded',
        "You've reached your monthly word limit. Please upgrade your subscription to continue.",
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('🎤 Starting recording...');
      await startRecording();
      setRecordingTime(0);
      setRecordingProgress(0);
      console.log('🎤 Recording started successfully');
    } catch (error) {
      console.error('🎤 Error starting recording:', error);
      Alert.alert(
        'Error',
        'Failed to start recording. Please ensure your microphone is connected and permissions are granted.',
        [{ text: 'OK' }]
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
    console.log('🎤 Stop recording requested');
    try {
      await stopRecording();
      
      // Set a default title with date and time format
      setRecordingTitle(generateDefaultTitle());
      
      console.log('🎤 Recording stopped, showing title modal');
      setShowTitleModal(true);
    } catch (error) {
      console.error('🎤 Error stopping recording:', error);
      Alert.alert('Error', 'There was an issue stopping the recording.');
    }
  };

  // Handle save recording
  const handleSaveRecording = async () => {
    console.log('🎤 Save recording requested', {
      title: recordingTitle.trim(),
      recordingTime,
    });

    if (!recordingTitle.trim()) {
      console.log('🎤 Save blocked: no title provided');
      Alert.alert('Title required', 'Please provide a title for your recording.');
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

      // Get the recording blob
      const recordingBlob = await getRecordingBlob();
      
      if (!recordingBlob) {
        console.error('🎤 No recording blob available');
        throw new Error('No recording data available');
      }

      // Upload logic here (simplified for space)
      const formData = new FormData();
      const mimeType = recordingBlob.type || 'audio/m4a';
      const fileExtension = 'm4a';

      formData.append(
        'audio',
        recordingBlob as any,
        `recording_${Date.now()}.${fileExtension}`
      );
      formData.append('title', recordingTitle);
      formData.append('duration', recordingTime.toString());
      formData.append('recordingId', recording.id.toString());
      formData.append('detectSpeakers', detectSpeakers.toString());
      formData.append('createTranscript', createTranscript.toString());

      const uploadRes = await uploadFile('/api/recordings/upload', formData);

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }

      // Show success message
      Alert.alert('Success', 'Recording saved successfully!');

      // Reset state
      setRecordingTime(0);
      setRecordingProgress(0);
      setShowTitleModal(false);
      setRecordingTitle('');
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.title}>Record a Conversation</ThemedText>
        <ThemedText style={styles.description}>
          Record your conversations to get AI-powered insights on your communication style.
        </ThemedText>

        <GlassCard style={styles.recordingCard}>
          <View style={styles.cardContent}>
            {/* Show loading state while checking word limit */}
            {isCheckingWordLimit && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
                <ThemedText style={styles.loadingText}>
                  Checking word usage...
                </ThemedText>
              </View>
            )}

            {/* When loading is complete, show appropriate messages */}
            {!isCheckingWordLimit && (
              <>
                {/* Show word limit exceeded warning if needed */}
                {hasExceededWordLimit && (
                  <View style={styles.warningContainer}>
                    <Feather name="alert-circle" size={20} color="#FF6B6B" />
                    <View style={styles.warningTextContainer}>
                      <ThemedText style={styles.warningTitle}>
                        Word limit exceeded
                      </ThemedText>
                      <ThemedText style={styles.warningText}>
                        You've used {currentUsage} of {wordLimit} words this month.
                        Please upgrade your subscription to continue.
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Recording Interface */}
                <View style={styles.recordingInterface}>
                  {/* Recording Button */}
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      isRecording
                        ? isPaused
                          ? styles.recordButtonPaused
                          : styles.recordButtonActive
                        : hasExceededWordLimit
                        ? styles.recordButtonDisabled
                        : styles.recordButtonDefault,
                    ]}
                    onPress={
                      !isRecording && !hasExceededWordLimit
                        ? handleStartRecording
                        : undefined
                    }
                    disabled={hasExceededWordLimit}
                  >
                    <Feather
                      name="mic"
                      size={48}
                      color={hasExceededWordLimit ? '#666' : '#fff'}
                    />
                  </TouchableOpacity>

                  <ThemedText style={styles.recordingStatus}>
                    {isRecording
                      ? isPaused
                        ? 'Recording Paused'
                        : 'Recording in Progress'
                      : 'Start Recording'}
                  </ThemedText>

                  <ThemedText style={styles.recordingTime}>
                    {isRecording
                      ? `${formatTime(recordingTime)} / 50:00`
                      : 'Tap to start recording your conversation.\nLeaderTalk will analyze your communication patterns.'}
                  </ThemedText>

                  {/* Recording Controls */}
                  {isRecording && (
                    <View style={styles.recordingControls}>
                      <Button
                        title={isPaused ? 'Resume' : 'Pause'}
                        onPress={handlePauseResumeRecording}
                        variant={isPaused ? 'primary' : 'secondary'}
                        size="medium"
                        style={styles.controlButton}
                        icon={
                          <Feather
                            name={isPaused ? 'play' : 'pause'}
                            size={16}
                            color="#fff"
                          />
                        }
                      />

                      <Button
                        title="Stop"
                        onPress={handleStopRecording}
                        variant="secondary"
                        size="medium"
                        style={styles.controlButton}
                        icon={<Feather name="square" size={16} color="#fff" />}
                      />
                    </View>
                  )}

                  {/* Progress Bar */}
                  {isRecording && (
                    <View style={styles.progressContainer}>
                      <ProgressBar
                        progress={recordingProgress}
                        style={styles.progressBar}
                        height={6}
                      />
                      <View style={styles.progressLabels}>
                        <ThemedText style={styles.progressLabel}>0:00</ThemedText>
                        <ThemedText style={styles.progressLabel}>50:00</ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Settings */}
                  <View style={styles.settingsContainer}>
                    <Switch
                      value={detectSpeakers}
                      onValueChange={setDetectSpeakers}
                      disabled={isRecording}
                      label="Auto-detect speakers"
                      style={styles.settingItem}
                    />

                    <Switch
                      value={createTranscript}
                      onValueChange={setCreateTranscript}
                      disabled={isRecording}
                      label="Create transcript"
                      style={styles.settingItem}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </GlassCard>
      </ScrollView>

      {/* Title Modal */}
      <Modal
        visible={showTitleModal}
        onClose={() => setShowTitleModal(false)}
        title="Name Your Recording"
        description="Give your recording a descriptive title to help you identify it later."
        closeOnBackdrop={false}
      >
        <View style={styles.modalContent}>
          <TextInput
            value={recordingTitle}
            onChangeText={setRecordingTitle}
            placeholder="e.g., Team Meeting Discussion"
            label="Title"
            style={styles.titleInput}
          />

          <View style={styles.modalButtons}>
            <Button
              title={isProcessing ? 'Processing...' : 'Save Recording'}
              onPress={handleSaveRecording}
              disabled={isProcessing}
              variant="cta"
              size="large"
              loading={isProcessing}
            />
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  recordingCard: {
    marginTop: 8,
  },
  cardContent: {
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    fontSize: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: 'rgba(255, 107, 107, 0.8)',
    lineHeight: 20,
  },
  recordingInterface: {
    alignItems: 'center',
  },
  recordButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  recordButtonDefault: {
    backgroundColor: '#8A2BE2',
    borderWidth: 2,
    borderColor: '#9A3BE2',
  },
  recordButtonActive: {
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  recordButtonPaused: {
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  recordButtonDisabled: {
    backgroundColor: 'rgba(100, 100, 100, 0.5)',
    borderWidth: 2,
    borderColor: 'rgba(150, 150, 150, 0.5)',
  },
  recordingStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  recordingTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  controlButton: {
    minWidth: 100,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    marginBottom: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  settingsContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 24,
    gap: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalContent: {
    width: screenWidth - 80,
  },
  titleInput: {
    marginBottom: 24,
  },
  modalButtons: {
    alignItems: 'center',
  },
});
