import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { signOut } from '../lib/auth';
import { colors } from '../theme/colors';
import BottomNavigation from '../components/ui/BottomNavigation';
import GradientCard from '../components/ui/GradientCard';

// Mock user data
const mockUserData = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  dateOfBirth: '1990-01-01',
  profession: 'Product Manager',
  goals: 'Improve leadership communication',
  selectedLeaders: [1, 3, 5],
  wordUsage: {
    currentPeriodWords: 15000,
    maxWords: 50000,
    periodStartDate: '2025-05-01',
    periodEndDate: '2025-06-01',
    daysRemaining: 7,
  }
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [controversialLeadersEnabled, setControversialLeadersEnabled] = useState(false);
  
  // Use mock user data
  const user = mockUserData;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled by AppNavigator
            } catch (error) {
              console.error('Logout error:', error);
            }
          } 
        },
      ]
    );
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will remove all your data including recordings, transcripts, and training progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(); // Just sign out in mock implementation
              // Navigation will be handled by AppNavigator
            } catch (error) {
              console.error('Account deletion error:', error);
            }
          } 
        },
      ]
    );
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
        navigation.navigate('Recording');
        break;
      case 'progress':
        navigation.navigate('Transcripts');
        break;
      case 'profile':
        // Already on settings screen
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Information */}
        <GradientCard style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Profession</Text>
            <Text style={styles.infoValue}>{user.profession}</Text>
          </View>
        </GradientCard>
        
        {/* Word Usage */}
        <GradientCard style={styles.card}>
          <Text style={styles.cardTitle}>Word Usage</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Period</Text>
            <Text style={styles.infoValue}>
              {formatDate(user.wordUsage.periodStartDate)} - {formatDate(user.wordUsage.periodEndDate)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Words Used</Text>
            <Text style={styles.infoValue}>
              {user.wordUsage.currentPeriodWords} / {user.wordUsage.maxWords}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Days Remaining</Text>
            <Text style={styles.infoValue}>{user.wordUsage.daysRemaining}</Text>
          </View>
          
          <View style={styles.usageBarContainer}>
            <View style={styles.usageBar}>
              <View 
                style={[
                  styles.usageBarFill, 
                  { 
                    width: `${(user.wordUsage.currentPeriodWords / user.wordUsage.maxWords) * 100}%`,
                    backgroundColor: user.wordUsage.currentPeriodWords > user.wordUsage.maxWords * 0.8 ? colors.error : colors.success
                  }
                ]} 
              />
            </View>
          </View>
        </GradientCard>
        
        {/* App Settings */}
        <GradientCard style={styles.card}>
          <Text style={styles.cardTitle}>App Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Controversial Leaders</Text>
            <Switch
              value={controversialLeadersEnabled}
              onValueChange={setControversialLeadersEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </GradientCard>
        
        {/* Account Actions */}
        <GradientCard style={styles.card}>
          <Text style={styles.cardTitle}>Account Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLogout}
          >
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </GradientCard>
        
        {/* About */}
        <GradientCard style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Help & Support</Text>
          </TouchableOpacity>
        </GradientCard>

        {/* Add some space at the bottom for the navigation bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  usageBarContainer: {
    marginTop: 8,
  },
  usageBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 16,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
});
