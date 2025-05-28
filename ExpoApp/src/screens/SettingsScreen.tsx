import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch as RNSwitch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { signOut } from '../lib/auth';
import { H1, H2, H3, Paragraph, SmallText } from '../components/ui/Typography';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { colors } from '../theme/colors';

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
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [controversialLeadersEnabled, setControversialLeadersEnabled] = useState(false);
  
  // Use mock user data
  const user = mockUserData;

  // Handle notification toggle
  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  // Handle controversial leaders toggle
  const handleControversialLeadersToggle = () => {
    setControversialLeadersEnabled(!controversialLeadersEnabled);
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <H1>Settings</H1>
        <Paragraph style={styles.subtitle}>
          Manage your account and preferences
        </Paragraph>
      </View>

      {/* Account Information */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>Account Information</H2>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Name</Paragraph>
            <Paragraph>{user.name}</Paragraph>
          </View>
          
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Email</Paragraph>
            <Paragraph>{user.email}</Paragraph>
          </View>
          
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Profession</Paragraph>
            <Paragraph>{user.profession}</Paragraph>
          </View>
        </CardContent>
      </Card>
      
      {/* Word Usage */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>Word Usage</H2>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Current Period</Paragraph>
            <Paragraph>
              {formatDate(user.wordUsage.periodStartDate)} - {formatDate(user.wordUsage.periodEndDate)}
            </Paragraph>
          </View>
          
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Words Used</Paragraph>
            <Paragraph>
              {user.wordUsage.currentPeriodWords} / {user.wordUsage.maxWords}
            </Paragraph>
          </View>
          
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Days Remaining</Paragraph>
            <Paragraph>{user.wordUsage.daysRemaining}</Paragraph>
          </View>
          
          <View style={styles.usageBarContainer}>
            <View style={styles.usageBar}>
              <View 
                style={[
                  styles.usageBarFill, 
                  { 
                    width: `${(user.wordUsage.currentPeriodWords / user.wordUsage.maxWords) * 100}%`,
                    backgroundColor: user.wordUsage.currentPeriodWords > user.wordUsage.maxWords * 0.8 ? colors.destructive : '#10b981'
                  }
                ]} 
              />
            </View>
          </View>
        </CardContent>
      </Card>
      
      {/* App Settings */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>App Settings</H2>
        </CardHeader>
        <CardContent>
          <View style={styles.settingRow}>
            <Paragraph>Push Notifications</Paragraph>
            <RNSwitch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#e5e7eb', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
          
          <Separator />
          
          <View style={styles.settingRow}>
            <Paragraph>Show Controversial Leaders</Paragraph>
            <RNSwitch
              value={controversialLeadersEnabled}
              onValueChange={handleControversialLeadersToggle}
              trackColor={{ false: '#e5e7eb', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </CardContent>
      </Card>
      
      {/* Account Actions */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>Account Actions</H2>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onPress={handleLogout}
            style={styles.actionButton}
            icon={<MaterialIcons name="logout" size={20} color={colors.foreground} />}
          >
            Logout
          </Button>
          
          <Button 
            variant="outline" 
            onPress={handleDeleteAccount}
            style={[styles.actionButton, styles.dangerButton]}
            icon={<MaterialIcons name="delete" size={20} color={colors.destructive} />}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
      
      {/* About */}
      <Card style={styles.card}>
        <CardHeader>
          <H2>About</H2>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Paragraph style={styles.infoLabel}>Version</Paragraph>
            <Paragraph>1.0.0</Paragraph>
          </View>
          
          <Separator />
          
          <Button 
            variant="link" 
            style={styles.linkButton}
            icon={<MaterialIcons name="description" size={20} color={colors.primary} />}
          >
            Terms of Service
          </Button>
          
          <Button 
            variant="link" 
            style={styles.linkButton}
            icon={<MaterialIcons name="privacy-tip" size={20} color={colors.primary} />}
          >
            Privacy Policy
          </Button>
          
          <Button 
            variant="link" 
            style={styles.linkButton}
            icon={<MaterialIcons name="help" size={20} color={colors.primary} />}
          >
            Help & Support
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  subtitle: {
    color: colors.mutedForeground,
    marginTop: 8,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    color: colors.mutedForeground,
  },
  usageBarContainer: {
    marginTop: 8,
  },
  usageBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
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
  actionButton: {
    marginBottom: 16,
  },
  dangerButton: {
    borderColor: colors.destructive,
  },
  dangerText: {
    color: colors.destructive,
  },
  linkButton: {
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
});
