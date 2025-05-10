import { useState, useEffect, useCallback } from 'react';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'checking';

export function useMicrophonePermission() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  // Function to check microphone permission
  const checkPermission = useCallback(async () => {
    try {
      // Check if the browser supports the permissions API
      if (!navigator.permissions) {
        console.log('Permissions API not supported, will request at recording time');
        setPermissionStatus('prompt');
        return 'prompt';
      }

      // Query current microphone permission
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      setPermissionStatus(result.state as PermissionStatus);
      
      // Set up listener for permission changes
      result.addEventListener('change', () => {
        setPermissionStatus(result.state as PermissionStatus);
      });

      return result.state;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionStatus('prompt');
      return 'prompt';
    }
  }, []);

  // Function to request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // If already granted, no need to request again
      if (permissionStatus === 'granted') {
        return true;
      }
      
      // Request microphone access - this will trigger the browser permission prompt if needed
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we got here, permission was granted
      setPermissionStatus('granted');
      
      // Clean up the stream since we're just checking permissions
      stream.getTracks().forEach(track => track.stop());
      
      // Re-check permission status to ensure it's updated
      await checkPermission();
      
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setPermissionStatus('denied');
      return false;
    }
  }, [permissionStatus, checkPermission]);

  return {
    permissionStatus,
    checkPermission,
    requestPermission,
    isGranted: permissionStatus === 'granted',
    isDenied: permissionStatus === 'denied',
    isPrompt: permissionStatus === 'prompt',
    isChecking: permissionStatus === 'checking'
  };
}