import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { useAuth } from '@/src/hooks/useAuth';
import { Image } from 'expo-image';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = React.useState(colorScheme === 'dark');
  const [notifications, setNotifications] = React.useState(true);
  
  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </View>
        
        <ThemedView style={styles.profileCard}>
          <Image
            source={{ uri: user?.photoUrl || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <ThemedText type="subtitle">{user?.firstName} {user?.lastName}</ThemedText>
            <ThemedText style={styles.email}>{user?.email}</ThemedText>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <FontAwesome name="pencil" size={16} color={textColor} />
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Preferences</ThemedText>
          
          <ThemedView style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <FontAwesome name="moon-o" size={20} color={textColor} style={styles.settingIcon} />
              <ThemedText>Dark Mode</ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#0070f3' }}
              thumbColor="#f4f3f4"
            />
          </ThemedView>
          
          <ThemedView style={styles.settingItem}>
            <View style={styles.settingLabel}>
              <FontAwesome name="bell" size={20} color={textColor} style={styles.settingIcon} />
              <ThemedText>Notifications</ThemedText>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#0070f3' }}
              thumbColor="#f4f3f4"
            />
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLabel}>
              <FontAwesome name="user" size={20} color={textColor} style={styles.menuIcon} />
              <ThemedText>Account Information</ThemedText>
            </View>
            <FontAwesome name="chevron-right" size={16} color={textColor} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLabel}>
              <FontAwesome name="credit-card" size={20} color={textColor} style={styles.menuIcon} />
              <ThemedText>Subscription</ThemedText>
            </View>
            <FontAwesome name="chevron-right" size={16} color={textColor} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLabel}>
              <FontAwesome name="users" size={20} color={textColor} style={styles.menuIcon} />
              <ThemedText>Leaders</ThemedText>
            </View>
            <FontAwesome name="chevron-right" size={16} color={textColor} />
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Support</ThemedText>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLabel}>
              <FontAwesome name="question-circle" size={20} color={textColor} style={styles.menuIcon} />
              <ThemedText>Help & Support</ThemedText>
            </View>
            <FontAwesome name="chevron-right" size={16} color={textColor} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLabel}>
              <FontAwesome name="file-text" size={20} color={textColor} style={styles.menuIcon} />
              <ThemedText>Privacy Policy</ThemedText>
            </View>
            <FontAwesome name="chevron-right" size={16} color={textColor} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLabel}>
              <FontAwesome name="file-text-o" size={20} color={textColor} style={styles.menuIcon} />
              <ThemedText>Terms of Service</ThemedText>
            </View>
            <FontAwesome name="chevron-right" size={16} color={textColor} />
          </TouchableOpacity>
        </ThemedView>
        
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <FontAwesome name="sign-out" size={20} color="#fff" style={styles.signOutIcon} />
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginVertical: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  email: {
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  menuItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 8,
    marginVertical: 24,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    opacity: 0.5,
    marginBottom: 24,
  },
});
