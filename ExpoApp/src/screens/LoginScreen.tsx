import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, TextInput as RNTextInput } from 'react-native';
import { signIn } from '../lib/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { H1, H2, Paragraph, SmallText, H4 } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Separator } from '../components/ui/Separator';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }
    
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
        <H1 style={styles.appName}>LeaderTalk</H1>
        <Paragraph style={styles.tagline}>
          Transform your communication skills with AI-powered coaching
        </Paragraph>
      </View>

      <Card style={styles.card}>
        <CardContent>
          <H2 style={styles.cardTitle}>Sign In</H2>
          
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button
            onPress={handleSignIn}
            loading={isLoading}
            disabled={isLoading}
            style={styles.signInButton}
          >
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <SmallText style={styles.dividerText}>OR</SmallText>
            <View style={styles.dividerLine} />
          </View>

          <Button
            variant="outline"
            onPress={handleDemoLogin}
            disabled={isLoading}
            style={styles.demoButton}
          >
            Try Demo
          </Button>
        </CardContent>
      </Card>

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
    </View>
  );
}

const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <MaterialIcons name={icon} size={24} color={colors.primary} />
    <View style={styles.featureTextContainer}>
      <H4 style={styles.featureTitle}>{title}</H4>
      <SmallText style={styles.featureDescription}>{description}</SmallText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
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
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    marginHorizontal: 20,
    color: colors.mutedForeground,
  },
  card: {
    marginBottom: 32,
  },
  cardTitle: {
    marginBottom: 16,
  },
  signInButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 8,
  },
  demoButton: {
    borderColor: colors.primary,
  },
  featuresContainer: {
    marginTop: 16,
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
    marginBottom: 4,
  },
  featureDescription: {
    color: colors.mutedForeground,
  },
});
