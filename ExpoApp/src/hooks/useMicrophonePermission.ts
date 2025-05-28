import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'undetermined';

interface UseMicrophonePermissionReturn {
  permissionStatus: PermissionStatus;
  requestPermission: () => Promise<boolean>;
  isDenied: boolean;
}

export function useMicrophonePermission(): UseMicrophonePermissionReturn {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [isDenied, setIsDenied] = useState(false);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  // Check current permission status
  const checkPermission = async (): Promise<void> => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setPermissionStatus(status);
      setIsDenied(status === 'denied');
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionStatus('undetermined');
      setIsDenied(false);
    }
  };

  // Request permission
  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionStatus(status);
      setIsDenied(status === 'denied');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setPermissionStatus('undetermined');
      setIsDenied(false);
      return false;
    }
  };

  return {
    permissionStatus,
    requestPermission,
    isDenied,
  };
}
