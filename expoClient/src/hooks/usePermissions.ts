import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { Platform, Linking } from 'react-native';

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'undetermined';
  loading: boolean;
}

export function usePermissions(): PermissionStatus {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    microphone: 'undetermined',
    loading: true,
  });

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log('🔐 Checking app permissions...');
        
        // Check microphone permission
        const { status: micStatus } = await Audio.getPermissionsAsync();
        
        setPermissionStatus({
          microphone: micStatus,
          loading: false,
        });
        
        console.log('🔐 Mic permission status:', micStatus);
      } catch (error) {
        console.error('🔐 Error checking permissions:', error);
        setPermissionStatus({
          microphone: 'denied',
          loading: false,
        });
      }
    };

    checkPermissions();
  }, []);

  return permissionStatus;
}

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    console.log('🎤 Requesting microphone permission...');
    const { status } = await Audio.requestPermissionsAsync();
    console.log('🎤 Microphone permission result:', status);
    return status === 'granted';
  } catch (error) {
    console.error('🎤 Error requesting microphone permission:', error);
    return false;
  }
};

export const openAppSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('🔐 Failed to open app settings:', error);
  }
};
