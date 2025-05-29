import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Modal, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { useRecording } from '../hooks/useRecording';
import { useMicrophonePermission } from '../hooks/useMicrophonePermission';
import { apiRequest } from '../lib/api';
import { Recording, WordUsageData } from '../types';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../theme/colors';
import BottomNavigation from '../components/ui/BottomNavigation';
import GradientCard from '../components/ui/GradientCard';

export default function RecordingScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('sessions');
  const [recordingTitle, setRecordingTitle] = useState('');
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectSpeakers, setDetectSpeakers] = useState(true);
  const [createTranscript, setCreateTranscript] = useState(true);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const MAX_RECORDING_TIME = 50 * 60; // 50 minutes in seconds
  
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header animation style
  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - (scrollY.value * 0.01 > 0.6 ? 0.6 : scrollY.value * 0.01),
      transform: [{ translateY: scrollY.value > 100 ? -100 : 0 }],
    };
  });

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigate to the appropriate screen based on the tab
    switch (tab) {
      case 'home':
        navigation.navigate('Dashboard');
        break;
      case 'explore':
        // Navigate to explore screen when implemented
        break;
      case 'sessions':
        // Already on recording screen
        break;
      case 'progress':
        navigation.navigate('Transcripts');
        break;
      case 'profile':
        navigation.navigate('Settings');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record</Text>
        <View style={{ width: 50 }} />
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent} 
        onScroll={onScroll} 
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Record a Conversation</Text>
        <Text style={styles.subtitle}>
          Record your conversations to get AI-powered insights on your communication style.
        </Text>

        {/* Recording Card */}
        <GradientCard style={styles.recordingCard}>
          {/* Word limit warning */}
          {hasExceededWordLimit && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                You've reached your monthly word limit. Please upgrade your subscription to continue.
              </Text>
            </View>
          )}

          {/* Recording Button */}
          <TouchableOpacity
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
            onPress={!isRecording && !hasExceededWordLimit ? handleStartRecording : undefined}
            disabled={hasExceededWordLimit}
          >
            <Text style={styles.micIcon}>🎙️</Text>
          </TouchableOpacity>

          <Text style={styles.recordingStatus}>
            {isRecording
              ? isPaused
                ? 'Recording Paused'
                : 'Recording in Progress'
              : 'Tap to Start Recording'}
          </Text>

          <Text style={styles.recordingTime}>
            {isRecording
              ? `${formatTime(duration)} / 50:00`
              : 'Tap the microphone to start recording your conversation.\nLeaderTalk will analyze your communication patterns.'}
          </Text>

          {/* Microphone permission warning */}
          {isDenied && !isRecording && (
            <View style={styles.permissionWarning}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.permissionWarningText}>
                Microphone access denied. Please enable it in your device settings to record conversations.
              </Text>
            </View>
          )}

          {/* Recording Controls */}
          {isRecording && (
            <View style={styles.controlsContainer}>
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
                  <Text style={styles.timeLabel}>0:00</Text>
                  <Text style={styles.timeLabel}>50:00</Text>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                  onPress={handlePauseResumeRecording}
                >
                  <Text style={styles.buttonText}>{isPaused ? '▶️ Resume' : '⏸️ Pause'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={handleStopRecording}
                >
                  <Text style={styles.buttonText}>⏹️ Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Settings */}
          <View style={styles.settingsContainer}>
            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => !isRecording && setDetectSpeakers(!detectSpeakers)}
              disabled={isRecording}
            >
              <Text style={styles.checkboxIcon}>{detectSpeakers ? '☑️' : '⬜'}</Text>
              <Text style={[styles.settingLabel, isRecording && styles.disabledText]}>
                Auto-detect speakers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => !isRecording && setCreateTranscript(!createTranscript)}
              disabled={isRecording}
            >
              <Text style={styles.checkboxIcon}>{createTranscript ? '☑️' : '⬜'}</Text>
              <Text style={[styles.settingLabel, isRecording && styles.disabledText]}>
                Create transcript
              </Text>
            </TouchableOpacity>
          </View>
        </GradientCard>

        {/* Add some space at the bottom for the navigation bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

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
              placeholderTextColor={colors.textMuted}
              value={recordingTitle}
              onChangeText={setRecordingTitle}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTitleDialog(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isProcessing && styles.disabledButton]}
                onPress={handleSaveRecording}
                disabled={isProcessing}
              >
                <Text style={styles.saveButtonText}>
                  {isProcessing ? 'Processing...' : 'Save Recording'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 10,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  recordingCard: {
    padding: 24,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    color: colors.text,
    flex: 1,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  micIcon: {
    fontSize: 48,
  },
  inactiveButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderColor: colors.primary,
  },
  activeButton: {
    backgroundColor: colors.primary,
    borderColor: '#6b21a8',
  },
  pausedButton: {
    backgroundColor: colors.accent1,
    borderColor: '#b91c1c',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: colors.border,
    opacity: 0.7,
  },
  recordingStatus: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  permissionWarningText: {
    color: colors.text,
    flex: 1,
  },
  controlsContainer: {
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 12,
    color: colors.textMuted,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: colors.primary,
  },
  resumeButton: {
    backgroundColor: colors.accent2,
  },
  stopButton: {
    backgroundColor: colors.accent1,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '600',
  },
  settingsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  disabledText: {
    color: colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
});
