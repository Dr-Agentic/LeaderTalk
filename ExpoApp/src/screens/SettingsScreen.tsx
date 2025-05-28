import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph, Switch, Divider, Dialog, Portal } from 'react-native-paper';
import { signOut } from '../lib/auth';

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
    setDeleteDialogVisible(false);
    try {
      await signOut(); // Just sign out in mock implementation
      // Navigation will be handled by AppNavigator
    } catch (error) {
      console.error('Account deletion error:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Account Information</Title>
          <Paragraph>Name: {user.name}</Paragraph>
          <Paragraph>Email: {user.email}</Paragraph>
          <Paragraph>Profession: {user.profession}</Paragraph>
        </Card.Content>
      </Card>
      
      {/* Word Usage */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Word Usage</Title>
          <View style={styles.usageContainer}>
            <View style={styles.usageRow}>
              <Text>Current Period:</Text>
              <Text>
                {formatDate(user.wordUsage.periodStartDate)} - {formatDate(user.wordUsage.periodEndDate)}
              </Text>
            </View>
            
            <View style={styles.usageRow}>
              <Text>Words Used:</Text>
              <Text>
                {user.wordUsage.currentPeriodWords} / {user.wordUsage.maxWords}
              </Text>
            </View>
            
            <View style={styles.usageRow}>
              <Text>Days Remaining:</Text>
              <Text>{user.wordUsage.daysRemaining}</Text>
            </View>
            
            <View style={styles.usageBarContainer}>
              <View 
                style={[
                  styles.usageBar, 
                  { 
                    width: `${(user.wordUsage.currentPeriodWords / user.wordUsage.maxWords) * 100}%`,
                    backgroundColor: user.wordUsage.currentPeriodWords > user.wordUsage.maxWords * 0.8 ? '#f44336' : '#4caf50'
                  }
                ]} 
              />
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* App Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          
          <View style={styles.settingRow}>
            <Text>Push Notifications</Text>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={handleNotificationsToggle} 
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.settingRow}>
            <Text>Show Controversial Leaders</Text>
            <Switch 
              value={controversialLeadersEnabled} 
              onValueChange={handleControversialLeadersToggle} 
            />
          </View>
        </Card.Content>
      </Card>
      
      {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Account Actions</Title>
          <Button 
            mode="outlined" 
            onPress={handleLogout}
            style={styles.actionButton}
          >
            Logout
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => setDeleteDialogVisible(true)}
            style={[styles.actionButton, styles.dangerButton]}
            textColor="#f44336"
          >
            Delete Account
          </Button>
        </Card.Content>
      </Card>
      
      {/* Delete Account Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete your account? This action cannot be undone and will remove all your data including recordings, transcripts, and training progress.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteAccount} textColor="#f44336">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  usageContainer: {
    marginTop: 8,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  usageBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
  },
  usageBar: {
    height: '100%',
    borderRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  dangerButton: {
    borderColor: '#f44336',
  },
});
