import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { signIn } from '../lib/auth';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn(email, password);
      // The AppNavigator will handle navigation after auth state changes
    } catch (error) {
      console.error('Sign-in error:', error);
      Alert.alert('Authentication Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Use demo credentials
      await signIn('demo@example.com', 'password123');
    } catch (error) {
      console.error('Demo login error:', error);
      Alert.alert(
        'Demo Login Error',
        'Failed to login with demo account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>LeaderTalk</Text>
        <Text style={styles.tagline}>
          Transform your communication skills with AI-powered coaching
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <FeatureItem
          icon="mic"
          title="Record & Analyze"
          description="Record conversations and get AI-powered analysis"
        />
        <FeatureItem
          icon="insights"
          title="Leadership Insights"
          description="Learn from communication styles of selected leaders"
        />
        <FeatureItem
          icon="school"
          title="Training Modules"
          description="Practice with structured learning modules"
        />
      </View>

      <View style={styles.authContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Button
          mode="contained"
          onPress={handleSignIn}
          loading={isLoading}
          disabled={isLoading}
          style={styles.signInButton}
          contentStyle={styles.buttonContent}
        >
          Sign In
        </Button>

        <Button
          mode="outlined"
          onPress={handleDemoLogin}
          disabled={isLoading}
          style={styles.demoButton}
          contentStyle={styles.buttonContent}
        >
          Try Demo
        </Button>
      </View>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <View style={styles.featureItem}>
    <MaterialIcons name={icon} size={24} color="#e53e3e" />
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  authContainer: {
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  signInButton: {
    marginBottom: 16,
    backgroundColor: '#e53e3e',
  },
  demoButton: {
    borderColor: '#e53e3e',
  },
  buttonContent: {
    height: 48,
  },
});
