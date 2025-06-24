import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { usePathname } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AppHeader } from './AppHeader';
import { DrawerNavigation } from './DrawerNavigation';
import { apiRequest } from '../../lib/apiClient';

interface AppLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  pageTitle?: string;
  hideHeader?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function AppLayout({
  children,
  showBackButton = false,
  backTo,
  backLabel = 'Back',
  pageTitle,
  hideHeader = false,
}: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Animation values
  const drawerTranslateX = useSharedValue(-280);
  const backdropOpacity = useSharedValue(0);

  // Get the current user
  const { data: user } = useQuery({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/users/me');
        return await response.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    retry: 1,
  });

  // Handle drawer animations
  useEffect(() => {
    if (drawerOpen) {
      drawerTranslateX.value = withSpring(0, { damping: 15 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      drawerTranslateX.value = withSpring(-280, { damping: 15 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [drawerOpen]);

  // Determine the title based on the current location
  const determineTitle = () => {
    if (pageTitle) return pageTitle;

    // Default mapping between routes and titles
    const titleMap: Record<string, string> = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/recording': 'Record & Analyze',
      '/transcripts': 'All Transcripts',
      '/progress': 'My Progress',
      '/training': 'Training Module',
      '/leadership-inspirations': 'Leadership Inspirations',
      '/subscription': 'Manage Subscription',
      '/settings': 'Settings',
    };

    // Check if the current location matches any of our defined routes
    if (pathname in titleMap) {
      return titleMap[pathname];
    }

    // For other routes, try to extract a title from the path
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      // Get the last non-id segment
      const lastSegment = segments[segments.length - 1];
      if (!lastSegment.match(/^\d+$/)) {
        return lastSegment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // If last segment is an ID, use previous segment
      if (segments.length > 1) {
        const previousSegment = segments[segments.length - 2];
        return previousSegment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    return 'LeaderTalk';
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedDrawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerTranslateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      {!hideHeader && (
        <AppHeader
          title={determineTitle()}
          showBackButton={showBackButton}
          backTo={backTo}
          backLabel={backLabel}
          onMenuPress={() => setDrawerOpen(true)}
          user={user}
        />
      )}

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Drawer Modal */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        onRequestClose={handleDrawerClose}
      >
        <View style={styles.modalContainer}>
          {/* Animated Backdrop */}
          <TouchableWithoutFeedback onPress={handleDrawerClose}>
            <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
          </TouchableWithoutFeedback>

          {/* Animated Drawer positioned below Dynamic Island */}
          <Animated.View style={[styles.drawerContainer, animatedDrawerStyle]}>
            <DrawerNavigation
              user={user}
              currentRoute={pathname}
              onClose={handleDrawerClose}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 44, // Position below Dynamic Island (60px banner + 10px padding)
    left: 0,
    width: Math.min(280, screenWidth * 0.8),
    height: screenHeight - (Platform.OS === 'ios' ? 70 : 44), // Full height minus top offset
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
});
