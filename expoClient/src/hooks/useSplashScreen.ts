import { useState, useEffect, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

interface UseSplashScreenOptions {
  minDisplayTime?: number;
  autoHide?: boolean;
}

interface UseSplashScreenReturn {
  isReady: boolean;
  showCustomSplash: boolean;
  onCustomSplashComplete: () => void;
  hideSplashScreen: () => Promise<void>;
}

/**
 * Custom hook to manage splash screen lifecycle
 * Coordinates between Expo's native splash screen and custom splash screen
 */
export function useSplashScreen({
  minDisplayTime = 2500,
  autoHide = true,
}: UseSplashScreenOptions = {}): UseSplashScreenReturn {
  const [isReady, setIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  // Prevent native splash screen from auto-hiding
  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        
        // Pre-load fonts, make any API calls you need to do here
        // For now, we'll just simulate some loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Tell the application to render
        setAppIsReady(true);
      } catch (e) {
        console.warn('Error during splash screen preparation:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hide native splash screen when app is ready
  useEffect(() => {
    if (appIsReady) {
      const hideNativeSplash = async () => {
        try {
          await SplashScreen.hideAsync();
          setIsReady(true);
        } catch (e) {
          console.warn('Error hiding native splash screen:', e);
          setIsReady(true);
        }
      };

      hideNativeSplash();
    }
  }, [appIsReady]);

  // Handle custom splash screen completion
  const onCustomSplashComplete = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  // Manual splash screen hide function
  const hideSplashScreen = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
      setShowCustomSplash(false);
      setIsReady(true);
    } catch (e) {
      console.warn('Error manually hiding splash screen:', e);
    }
  }, []);

  return {
    isReady: isReady && !showCustomSplash,
    showCustomSplash: showCustomSplash && isReady,
    onCustomSplashComplete,
    hideSplashScreen,
  };
}
