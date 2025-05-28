import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRecording } from '../hooks/useRecording';
import { useMicrophonePermission } from '../hooks/useMicrophonePermission';
import { apiRequest } from '../lib/api';
import { Recording, WordUsageData } from '../types';
import { useQuery } from '@tanstack/react-query';
import { H1, H2, Paragraph, SmallText } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { colors } from '../theme/colors';

export default function RecordingScreen() {
  const navigation = useNavigation();
  const [recordingTitle, setRecordingTitle] = useState('');
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectSpeakers, setDetectSpeakers] = useState(true);
  const [createTranscript, setCreateTranscript] = useState(true);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds

  // Query for checking word limits
  const { 
    data: wordUsageData, 
    isLoading: isCheckingWordLimit,
    error: wordLimitError,
  } = useQuery<WordUsageData>({
    queryKey: ["/api/users/word-usage"],
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Only consider word limit data valid if loaded and greater than 0
  const hasWordLimitData = !isCheckingWordLimit && wordUsageData?.wordLimit !== undefined && wordUsageData.wordLimit > 0;
  
  // Calculate if limit exceeded only if we have valid limit data
  const hasExceededWordLimit = hasWordLimitData && wordUsageData?.currentUsage !== undefined 
    ? wordUsageData.currentUsage >= wordUsageData.wordLimit 
    : false;

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

    // Check if the user has exceeded their word limit
    if (hasExceededWordLimit) {
      Alert.alert(
        'Word Limit Exceeded',
        'You\'ve reached your monthly word limit. Please upgrade your subscription to continue.'
      );
      return;
    }

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

      // Show success message
      Alert.alert(
        'Recording Saved',
        'Your recording has been saved and is being analyzed.'
      );

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <H1>Record a Conversation</H1>
        <Paragraph style={styles.subtitle}>
          Record your conversations to get AI-powered insights on your communication style.
        </Paragraph>
      </View>

      <Card style={styles.card}>
        <CardContent>
          {/* Word limit warning */}
          {hasExceededWordLimit && (
            <View style={styles.warningBanner}>
              <MaterialIcons name="warning" size={24} color="#fff" />
              <Paragraph style={styles.warningText}>
                You've reached your monthly word limit. Please upgrade your subscription to continue.
              </Paragraph>
            </View>
          )}

          <View style={styles.recordingContainer}>
            {/* Recording Button */}
            <View style={styles.recordButtonContainer}>
              <View
                style={[
                  styles.recordButton,
                  isRecording
                    ? isPaused
                      ? styles.pausedButton
                      : styles.activeButton
                    : hasExceededWordLimit
                      ? styles.disabledButton
                      : styles.inactiveButton,
                ]}
              >
                <MaterialIcons
                  name="mic"
                  size={48}
                  color={isRecording ? 'white' : colors.primary}
                  onPress={!isRecording && !hasExceededWordLimit ? handleStartRecording : undefined}
                  style={hasExceededWordLimit ? styles.disabledIcon : {}}
                />
              </View>
            </View>

            <H2 style={styles.recordingStatus}>
              {isRecording
                ? isPaused
                  ? 'Recording Paused'
                  : 'Recording in Progress'
                : 'Start Recording'}
            </H2>

            <Paragraph style={styles.recordingTime}>
              {isRecording
                ? `${formatTime(duration)} / 50:00`
                : 'Tap the microphone to start recording your conversation.\nLeaderTalk will analyze your communication patterns.'}
            </Paragraph>

            {/* Microphone permission warning */}
            {isDenied && !isRecording && (
              <View style={styles.permissionWarning}>
                <MaterialIcons name="error" size={16} color={colors.destructive} />
                <SmallText style={styles.permissionWarningText}>
                  Microphone access denied. Please enable it in your device settings to record conversations.
                </SmallText>
              </View>
            )}

            {/* Recording Controls */}
            {isRecording && (
              <View style={styles.controlsContainer}>
                <View style={styles.buttonContainer}>
                  <Button
                    variant={isPaused ? 'default' : 'destructive'}
                    onPress={handlePauseResumeRecording}
                    style={styles.controlButton}
                    icon={<MaterialIcons name={isPaused ? 'play-arrow' : 'pause'} size={20} color="white" />}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>

                  <Button
                    variant="outline"
                    onPress={handleStopRecording}
                    style={styles.controlButton}
                    icon={<MaterialIcons name="stop" size={20} color={colors.foreground} />}
                  >
                    Stop
                  </Button>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${recordingProgress}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.timeLabels}>
                    <SmallText style={styles.timeLabel}>0:00</SmallText>
                    <SmallText style={styles.timeLabel}>50:00</SmallText>
                  </View>
                </View>
              </View>
            )}

            {/* Settings */}
            <View style={styles.settingsContainer}>
              <View style={styles.settingRow}>
                <MaterialIcons 
                  name={detectSpeakers ? 'check-box' : 'check-box-outline-blank'} 
                  size={24} 
                  color={isRecording ? colors.mutedForeground : colors.primary}
                  onPress={() => !isRecording && setDetectSpeakers(!detectSpeakers)}
                />
                <Paragraph 
                  style={[
                    styles.settingLabel, 
                    isRecording && styles.disabledText
                  ]}
                  onPress={() => !isRecording && setDetectSpeakers(!detectSpeakers)}
                >
                  Auto-detect speakers
                </Paragraph>
              </View>

              <View style={styles.settingRow}>
                <MaterialIcons 
                  name={createTranscript ? 'check-box' : 'check-box-outline-blank'} 
                  size={24} 
                  color={isRecording ? colors.mutedForeground : colors.primary}
                  onPress={() => !isRecording && setCreateTranscript(!createTranscript)}
                />
                <Paragraph 
                  style={[
                    styles.settingLabel, 
                    isRecording && styles.disabledText
                  ]}
                  onPress={() => !isRecording && setCreateTranscript(!createTranscript)}
                >
                  Create transcript
                </Paragraph>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Title Dialog */}
      <Modal
        visible={showTitleDialog}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTitleDialog(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <H2 style={styles.modalTitle}>Name Your Recording</H2>
            <Paragraph style={styles.modalSubtitle}>
              Give your recording a descriptive title to help you identify it later.
            </Paragraph>

            <Input
              placeholder="e.g., Team Meeting Discussion"
              value={recordingTitle}
              onChangeText={setRecordingTitle}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => setShowTitleDialog(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
  },
  subtitle: {
    color: colors.mutedForeground,
    marginTop: 8,
  },
  card: {
    margin: 24,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.destructive,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningText: {
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  recordButtonContainer: {
    marginBottom: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  inactiveButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  activeButton: {
    backgroundColor: colors.primary,
    borderColor: '#b91c1c',
  },
  pausedButton: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
    borderColor: '#d1d5db',
  },
  disabledIcon: {
    opacity: 0.5,
  },
  recordingStatus: {
    marginBottom: 8,
  },
  recordingTime: {
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    width: '100%',
  },
  permissionWarningText: {
    color: colors.destructive,
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
    marginBottom: 24,
  },
  controlButton: {
    marginHorizontal: 8,
    minWidth: 120,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    color: colors.mutedForeground,
  },
  settingsContainer: {
    width: '100%',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    marginLeft: 12,
  },
  disabledText: {
    color: colors.mutedForeground,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalSubtitle: {
    color: colors.mutedForeground,
    marginBottom: 24,
  },
  modalInput: {
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 12,
    minWidth: 100,
  },
});
