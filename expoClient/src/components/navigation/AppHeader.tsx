import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
  user?: any;
}

export function AppHeader({
  title = 'LeaderTalk',
  showBackButton = false,
  backTo = '/dashboard',
  backLabel = 'Back',
  onMenuPress,
  showMenuButton = true,
  user,
}: AppHeaderProps) {
  const handleBack = () => {
    if (backTo) {
      router.push(backTo);
    } else {
      router.back();
    }
  };

  const handleProfilePress = () => {
    router.push('/settings');
  };

  return (
    <>
      {/* Status Bar Banner - matches app theme and provides space for Dynamic Island */}
      <View style={styles.statusBarBanner}>
        <LinearGradient
          colors={['#8A2BE2', '#FF6B6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statusBarGradient}
        />
      </View>
      
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" translucent />
        
        <View style={styles.header}>
          {/* Left side controls */}
          <View style={styles.leftControls}>
            {/* Menu button for mobile */}
            {showMenuButton && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={onMenuPress}
              >
                <Feather name="menu" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            
            {/* Back button */}
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <Feather name="chevron-left" size={20} color="rgba(255, 255, 255, 0.7)" />
                <ThemedText style={styles.backLabel}>{backLabel}</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Center - Logo and title */}
          <View style={styles.centerContent}>
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={() => router.push('/dashboard')}
            >
              <ThemedText style={styles.logoText}>LeaderTalk</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Right side - User profile */}
          <View style={styles.rightControls}>
            {user && (
              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleProfilePress}
              >
                {user.photoUrl ? (
                  <Image
                    source={{ uri: user.photoUrl }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <ThemedText style={styles.profileInitial}>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  statusBarBanner: {
    height: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight || 24, // Increased height for Dynamic Island
    width: '100%',
  },
  statusBarGradient: {
    flex: 1,
    width: '100%',
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: Platform.OS === 'ios' ? 10 : 0, // Additional padding for iOS Dynamic Island
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  centerContent: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
