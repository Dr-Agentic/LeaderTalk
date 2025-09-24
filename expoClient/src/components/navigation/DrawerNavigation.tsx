import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../ThemedText';
import { theme } from '../../styles/theme';
import { signOut } from '../../lib/supabaseAuth';

interface DrawerNavigationProps {
  user?: any;
  currentRoute?: string;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: keyof typeof Feather.glyphMap;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'home' },
  { name: 'Record & Analyze', href: '/recording', icon: 'mic' },
  { name: 'All Transcripts', href: '/transcripts', icon: 'file-text' },
  { name: 'My Progress', href: '/progress', icon: 'trending-up' },
  { name: 'Training Module', href: '/training', icon: 'book-open' },
  { name: 'Leadership Inspirations', href: '/leadership-inspirations', icon: 'users' },
  { name: 'Manage Subscription', href: '/subscription', icon: 'credit-card' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

export function DrawerNavigation({ user, currentRoute, onClose }: DrawerNavigationProps) {
  const handleNavigation = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.drawerContent}>
        {/* Blur background */}
        <BlurView intensity={20} style={styles.blurBackground} />
        
        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} />

        {/* Header - no extra padding needed since we're positioned below Dynamic Island */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>LeaderTalk</ThemedText>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.navigation} showsVerticalScrollIndicator={false}>
          <View style={styles.navItems}>
            {navItems.map((item) => {
              const isActive = currentRoute === item.href;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                  ]}
                  onPress={() => handleNavigation(item.href)}
                >
                  <Feather
                    name={item.icon}
                    size={20}
                    color={isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)'}
                    style={styles.navIcon}
                  />
                  <ThemedText
                    style={[
                      styles.navText,
                      isActive && styles.navTextActive,
                    ]}
                  >
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer with user info and sign out */}
        {user && (
          <View style={styles.footer}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                {user.photoUrl ? (
                  <Image
                    source={{ uri: user.photoUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarInitial}>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.userDetails}>
                <ThemedText style={styles.userName}>
                  {user.username || 'User'}
                </ThemedText>
                <ThemedText style={styles.userEmail}>
                  {user.email}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Feather name="log-out" size={16} color="#fff" style={styles.signOutIcon} />
              <ThemedText style={styles.signOutText}>Sign out</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  drawerContent: {
    flex: 1,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  navigation: {
    flex: 1,
    paddingTop: 20,
  },
  navItems: {
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
  },
  navIcon: {
    marginRight: 12,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  navTextActive: {
    color: '#fff',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(138, 43, 226, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
