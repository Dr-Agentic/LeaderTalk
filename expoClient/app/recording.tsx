import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '../src/styles/theme';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '../src/components/ThemedText';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { Switch } from '../src/components/ui/Switch';
import { ProgressBar } from '../src/components/ui/ProgressBar';
import { Modal } from '../src/components/ui/Modal';
import { TextInput } from '../src/components/ui/TextInput';
import { AnimatedBackground } from '../src/components/ui/AnimatedBackground';

import { useRecording } from '../src/hooks/useRecording';
import { useWordLimit } from '../src/hooks/useWordLimit';
import { apiRequest, uploadFile } from '../src/lib/apiService';

const { width: screenWidth } = Dimensions.get('window');
const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds

export default function RecordingScreen() {
  // Always call hooks at the top level
  const queryClient = useQueryClient();
  
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

  // Handle cancel recording
  const handleCancelRecording = () => {
    console.log('🎤 Cancel recording requested');
    Alert.alert(
      'Cancel Recording',
      'Are you sure you want to cancel? Your recording will be lost.',
      [
        {
          text: 'Keep Recording',
          style: 'cancel',
        },
        {
          text: 'Cancel Recording',
          style: 'destructive',
          onPress: () => {
            // Reset state
            setRecordingTime(0);
            setRecordingProgress(0);
            setShowTitleModal(false);
            setRecordingTitle('');
            console.log('🎤 Recording cancelled by user');
          },
        },
      ]
    );
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

      console.log('🎤 Recording blob validated:', {
        size: recordingBlob.size,
        type: recordingBlob.type,
      });

      // Upload the audio file for analysis
      const formData = new FormData();

      // Validate the audio blob before uploading
      if (recordingBlob.size === 0) {
        throw new Error('Recording is empty (0 bytes). Please try again.');
      }

      if (recordingBlob.size < 1000) {
        console.warn(
          `Warning: Very small recording (${recordingBlob.size} bytes), might be corrupted`
        );
        Alert.alert(
          'Warning',
          'The recording is very small and might be incomplete. Continuing anyway.'
        );
      }

      console.log(
        `Preparing to upload audio: ${recordingBlob.size} bytes, type: ${recordingBlob.type}`
      );

      // Check for supported formats (OpenAI API requires specific formats)
      const mimeType = recordingBlob.type || 'audio/m4a'; // Default to m4a for iOS

      // Map MIME types to appropriate file extensions for OpenAI
      const fileExtensionMap: { [key: string]: string } = {
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
        'audio/aac': 'm4a',
      };

      // Use the mapped extension or default to 'm4a' if unknown (iOS default)
      const fileExtension = fileExtensionMap[mimeType] || 'm4a';

      console.log(
        `Uploading audio file with MIME type: ${mimeType} and extension: ${fileExtension}`
      );

      // Add the file to the form with an appropriate extension
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

      // Capture upload start time for timing
      const uploadStartTime = Date.now();
      console.log('🎤 Starting audio upload', {
        recordingId: recording.id,
        size: recordingBlob.size,
        filename: `recording_${Date.now()}.${fileExtension}`,
        mimeType: mimeType,
      });

      // Upload audio file with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        // Upload audio file
        const uploadRes = await uploadFile('/api/recordings/upload', formData, {
          signal: controller.signal,
        });

        // Clear the timeout
        clearTimeout(timeoutId);

        // Log timing information
        const uploadDuration = Date.now() - uploadStartTime;
        console.log(
          `Upload completed in ${uploadDuration}ms with status ${uploadRes.status}`
        );

        // Handle different response statuses
        if (!uploadRes.ok) {
          // Try to get detailed error information
          let errorMessage = `Server error: ${uploadRes.status} ${uploadRes.statusText}`;
          try {
            const errorData = await uploadRes.json();
            console.error('Upload error details:', errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error('Could not parse error response:', parseError);
          }

          throw new Error(errorMessage);
        }

        // Process successful response
        try {
          const responseText = await uploadRes.text();
          if (responseText) {
            const responseData = JSON.parse(responseText);
            console.log('Upload response:', responseData);
          } else {
            console.log('Empty response with status:', uploadRes.status);
          }
        } catch (parseError) {
          console.warn('Could not parse response:', parseError);
          console.log('Response status:', uploadRes.status);
        }
      } catch (error) {
        // Clear the timeout if fetch failed
        clearTimeout(timeoutId);

        const fetchError = error as Error;

        if (fetchError.name === 'AbortError') {
          console.error('Upload timed out after 60 seconds');
          throw new Error(
            'Upload timed out. Please try again with a shorter recording.'
          );
        }

        console.error('Fetch error during upload:', fetchError);
        throw fetchError;
      }

      // Show success message
      Alert.alert('Success', 'Recording saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Invalidate the recordings query to refresh the dashboard
            try {
              queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
            } catch (error) {
              console.warn('QueryClient not available:', error);
            }
            
            // Navigate to the transcript view
            router.push(`/transcript/${recording.id}`);
          },
        },
      ]);

      // Reset state
      setRecordingTime(0);
      setRecordingProgress(0);
      setShowTitleModal(false);
      setRecordingTitle('');
    } catch (error) {
      console.error('Recording error:', error);

      // Generate more specific error messages based on the error type
      let errorTitle = 'Error saving recording';
      let errorMessage = 'There was an issue saving your recording.';

      // Add more detailed error message if available
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;

        // Provide specific error messages for common issues
        if (
          errorMessage.includes('timed out') ||
          errorMessage.includes('timeout')
        ) {
          errorTitle = 'Upload timeout';
          errorMessage =
            'Your recording is too large or your connection is slow. Try recording a shorter segment or check your internet connection.';
        } else if (
          errorMessage.includes('network') ||
          errorMessage.includes('offline') ||
          errorMessage.includes('connection')
        ) {
          errorTitle = 'Network error';
          errorMessage =
            'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (
          errorMessage.includes('format') ||
          errorMessage.includes('corrupted') ||
          errorMessage.includes('invalid')
        ) {
          errorTitle = 'Audio format error';
          errorMessage =
            'The recording format is not supported or the file is corrupted. Try using a different device or restart and try again.';
        } else if (
          errorMessage.includes('empty') ||
          errorMessage.includes('0 bytes')
        ) {
          errorTitle = 'Empty recording';
          errorMessage =
            'No audio data was captured during recording. Check that your microphone is working and not muted, then try again.';
        } else if (
          errorMessage.includes('permission') ||
          errorMessage.includes('denied')
        ) {
          errorTitle = 'Microphone access denied';
          errorMessage =
            'The app doesn&apost; have permission to use your microphone. Please enable microphone access in your device settings.';
        }
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <AnimatedBackground />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Record a Conversation</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText style={styles.description}>
            Record your conversations to get AI-powered insights on your communication style.
          </ThemedText>

          <GlassCard style={styles.recordingCard}>
            <View style={styles.cardContent}>
              {/* Show loading state while checking word limit */}
              {isCheckingWordLimit && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
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
                      <Feather name="alert-circle" size={20} color={theme.colors.chart[5]} />
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
                        color={hasExceededWordLimit ? theme.colors.disabled : theme.colors.foreground}
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
                        : 'Click to start recording your conversation.\nLeaderTalk will analyze your communication patterns.'}
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
                              color={theme.colors.foreground}
                            />
                          }
                        />

                        <Button
                          title="Stop"
                          onPress={handleStopRecording}
                          variant="secondary"
                          size="medium"
                          style={styles.controlButton}
                          icon={<Feather name="square" size={16} color={theme.colors.foreground} />}
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
              
              <Button
                title="Cancel"
                onPress={handleCancelRecording}
                disabled={isProcessing}
                variant="secondary"
                size="large"
                style={styles.cancelButton}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    color: theme.colors.chart[5],
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
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  recordButtonDefault: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.primaryHover,
  },
  recordButtonActive: {
    backgroundColor: theme.colors.error,
    borderWidth: 2,
    borderColor: theme.colors.chart[5],
  },
  recordButtonPaused: {
    backgroundColor: theme.colors.warning,
    borderWidth: 2,
    borderColor: theme.colors.chart[3],
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
    gap: 12,
  },
  cancelButton: {
    marginTop: 8,
  },
});
