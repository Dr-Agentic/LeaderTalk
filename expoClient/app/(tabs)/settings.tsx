import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { theme } from '../../src/styles/theme';
import { AppLayout } from '../../src/components/navigation/AppLayout';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { ThemedText } from '../../src/components/ThemedText';
import { useAuth } from '../../src/hooks/useAuth';
import { apiRequest, queryClient } from '../../src/lib/apiService';
import { SubscriptionTimeline } from '../../src/components/subscription/SubscriptionTimeline';
import { WordUsageStats } from '../../src/components/dashboard/WordUsageStats';
import { BillingCycleHistory } from '../../src/components/dashboard/BillingCycleHistory';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Always dark for now
  const [notifications, setNotifications] = useState(true);

  // Delete user account mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/users/delete-account', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Sign out and redirect
              setTimeout(() => {
                signOut();
              }, 1000);
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.message || 'Failed to delete your account. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Your Account Permanently?',
      'This will immediately and permanently delete:\n\n• Your user profile and personal information\n• All recordings you\'ve created\n• All training progress and situation attempts\n• All word usage records\n• Selected leader preferences\n\nNote: If you have a paid subscription, any remaining balance in your current billing cycle cannot be reimbursed if you delete your account.\n\nThis action CANNOT be undone. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete My Account',
          style: 'destructive',
          onPress: () => deleteUserMutation.mutate(),
        },
      ]
    );
  };

  const handleSubscriptionPress = () => {
    router.push('/subscription');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <AppLayout pageTitle="Account Settings">
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Information */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Account Information</ThemedText>
            <ThemedText style={styles.cardDescription}>
              Manage your account details and preferences
            </ThemedText>
          </View>

          <View style={styles.accountInfo}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>NAME</ThemedText>
              <ThemedText style={styles.infoValue}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username || 'Not set'}
              </ThemedText>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>EMAIL</ThemedText>
              <ThemedText style={styles.infoValue}>{user?.email || 'Not set'}</ThemedText>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItemHalf}>
                <ThemedText style={styles.infoLabel}>DATE OF BIRTH</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.dateOfBirth || 'Not set'}</ThemedText>
              </View>
              <View style={styles.infoItemHalf}>
                <ThemedText style={styles.infoLabel}>PROFESSION</ThemedText>
                <ThemedText style={styles.infoValue}>{user?.profession || 'Not set'}</ThemedText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>GOALS</ThemedText>
              <ThemedText style={styles.infoValue}>{user?.goals || 'Not set'}</ThemedText>
            </View>
          </View>
        </GlassCard>

        {/* Subscription Timeline */}
        <SubscriptionTimeline />

        {/* Word Usage Stats */}
        <WordUsageStats />

        {/* Billing Cycle History */}
        <BillingCycleHistory />

        {/* Subscription Management */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Subscription Management</ThemedText>
            <ThemedText style={styles.cardDescription}>
              View and manage your subscription plan
            </ThemedText>
          </View>

          <View style={styles.cardContent}>
            <ThemedText style={styles.sectionDescription}>
              Manage your subscription plan, view billing information, and update payment methods.
            </ThemedText>
            
            <Button
              title="Manage Subscription"
              onPress={handleSubscriptionPress}
              style={styles.subscriptionButton}
              icon={<Feather name="credit-card" size={16} color="#fff" />}
            />
          </View>
        </GlassCard>

        {/* Preferences */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Preferences</ThemedText>
            <ThemedText style={styles.cardDescription}>
              Customize your app experience
            </ThemedText>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Feather name="bell" size={20} color="#fff" style={styles.settingIcon} />
                <ThemedText style={styles.settingText}>Notifications</ThemedText>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#767577', true: '#8A2BE2' }}
                thumbColor="#f4f3f4"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLabel}>
                <Feather name="moon" size={20} color="#fff" style={styles.settingIcon} />
                <ThemedText style={styles.settingText}>Dark Mode</ThemedText>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: '#8A2BE2' }}
                thumbColor="#f4f3f4"
                disabled={true} // Always dark for now
              />
            </View>
          </View>
        </GlassCard>

        {/* Account Deletion */}
        <GlassCard style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Delete Account</ThemedText>
            <ThemedText style={styles.cardDescription}>
              Permanently remove your account and data
            </ThemedText>
          </View>

          <View style={styles.cardContent}>
            <ThemedText style={styles.dangerLabel}>DELETE YOUR ACCOUNT</ThemedText>
            <ThemedText style={styles.dangerDescription}>
              This will permanently delete your entire account, including all your personal data,
              recordings, progress, and settings. This action cannot be undone.
            </ThemedText>
            
            <Button
              title={deleteUserMutation.isPending ? 'Deleting Account...' : 'Delete Account Permanently'}
              onPress={handleDeleteAccount}
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
              disabled={deleteUserMutation.isPending}
              loading={deleteUserMutation.isPending}
              icon={<Feather name="user-x" size={16} color="#FF6B6B" />}
            />
          </View>
        </GlassCard>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textStyle={styles.signOutButtonText}
          icon={<Feather name="log-out" size={16} color="#fff" />}
        />

        {/* Version */}
        <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: theme.fontSizes.heading3,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  cardContent: {
    gap: 16,
  },
  accountInfo: {
    gap: 16,
  },
  infoItem: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItemHalf: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  subscriptionButton: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
  },
  dangerCard: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 0,
  },
  dangerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    // backgroundColor: 'rgba(255, 107, 107, 0.1)',
    // borderWidth: 1,
    // borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteButtonText: {
    color: '#FFFFBB',
  },
  signOutButton: {
    //backgroundColor: '#f44336',
    marginVertical: 24,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
  },
});
