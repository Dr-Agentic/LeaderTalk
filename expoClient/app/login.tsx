import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle } from '../src/lib/supabaseAuth';
import { signInWithDemo } from '../src/lib/demoAuth';
import { router } from 'expo-router';
import { GlassCard } from '../src/components/ui/GlassCard';
import { Button } from '../src/components/ui/Button';
import { useTheme } from '../src/hooks/useTheme';
import { ThemedText } from '../src/components/ThemedText';
import { AnimatedBackground } from '../src/components/ui/AnimatedBackground';

export default function LoginScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  // initError removed (was unused)
  
  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    tagline: {
      color: theme.colors.muted,
    },
    title: {
      color: theme.colors.foreground,
    },
    description: {
      color: theme.colors.muted,
    },
    featureText: {
      color: theme.colors.foreground,
    },
    googleLogo: {
      backgroundColor: theme.colors.foreground,
    },
    googleLogoText: {
      color: theme.colors.primary,
    },
    termsText: {
      color: theme.colors.disabled,
    },
  }), [theme]);
  
  // Animation values: stable refs so they are not recreated each render
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  // Set up entrance animation with cleanup on unmount
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      // stop running animations and clear any native drivers
      animation.stop?.();
      try {
        cardOpacity.stopAnimation();
      } catch {
        /* ignore */
      }
      try {
        cardTranslateY.stopAnimation();
      } catch {
        /* ignore */
      }
    };
  }, [cardOpacity, cardTranslateY]);

  const handleGoogleSignIn = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      if (__DEV__) console.log('Google sign-in process initiated from UI');
      await signInWithGoogle();
      // Navigation handled by auth listener
    } catch (error) {
      if (__DEV__) console.error('Google sign-in error:', error);
      Alert.alert('Sign In Failed', 'Unable to sign in with Google. Please try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDemoSignIn = useCallback(async (): Promise<void> => {
    try {
      setDemoLoading(true);
      const success = await signInWithDemo();
      if (success) {
        router.replace('/dashboard');
      } else {
        Alert.alert('Demo Sign In Failed', 'Unable to sign in with demo account. Please try again.', [{ text: 'OK' }]);
      }
    } catch (error) {
      if (__DEV__) console.error('Demo sign-in error:', error);
      Alert.alert('Demo Sign In Failed', 'Unable to sign in with demo account. Please try again.', [{ text: 'OK' }]);
    } finally {
      setDemoLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <AnimatedBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <ThemedText style={styles.logoText}>LeaderTalk</ThemedText>
            <ThemedText style={[styles.tagline, dynamicStyles.tagline]}>
              Talk Like the Leader You Aspire to Be
            </ThemedText>
          </View>
          
          {/* Main Card with Glass Effect */}
          <Animated.View 
            style={[
              styles.cardContainer,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }]
              }
            ]}
          >
            <GlassCard 
              variant="hero" 
              style={styles.glassCard}
              showShimmer={true}
            >
              <View style={styles.cardContent}>
                <ThemedText style={[styles.title, dynamicStyles.title]}>Welcome to LeaderTalk</ThemedText>
                <ThemedText style={[styles.description, dynamicStyles.description]}>
                  Transform your communication skills with AI-powered coaching and personalized feedback.
                </ThemedText>
                
                {/* Features List */}
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <ThemedText style={styles.featureIcon}>🎯</ThemedText>
                    <ThemedText style={[styles.featureText, dynamicStyles.featureText]}>
                      Personalized speech analysis
                    </ThemedText>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <ThemedText style={styles.featureIcon}>🎭</ThemedText>
                    <ThemedText style={[styles.featureText, dynamicStyles.featureText]}>
                      Leadership style emulation
                    </ThemedText>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <ThemedText style={styles.featureIcon}>📈</ThemedText>
                    <ThemedText style={[styles.featureText, dynamicStyles.featureText]}>
                      Progress tracking & insights
                    </ThemedText>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonSection}>
                  <View
                    accessible
                    accessibilityLabel="Sign in with your Google account"
                    accessibilityRole="button"
                    accessibilityHint="Opens Google sign-in flow"
                  >
                    <Button
                      title="Continue with Google"
                      onPress={handleGoogleSignIn}
                      variant="cta"
                      size="large"
                      loading={loading}
                      disabled={loading || demoLoading}
                      style={styles.googleButton}
                      icon={
                        !loading && (
                          <View style={[styles.googleLogo, dynamicStyles.googleLogo]}>
                            <ThemedText style={[styles.googleLogoText, dynamicStyles.googleLogoText]}>G</ThemedText>
                          </View>
                        )
                      }
                    />
                  </View>

                  <View
                    accessible
                    accessibilityLabel="Sign in with demo account"
                    accessibilityRole="button"
                    accessibilityHint="Signs you in with a demonstration account"
                  >
                    <Button
                      title="Try Demo Account"
                      onPress={handleDemoSignIn}
                      variant="glass"
                      size="large"
                      loading={demoLoading}
                      disabled={loading || demoLoading}
                      style={styles.demoButton}
                    />
                  </View>
                </View>

                <ThemedText style={[styles.termsText, dynamicStyles.termsText]}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </ThemedText>
              </View>
            </GlassCard>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  glassCard: {
    padding: 0, // Remove default padding since we'll add it to cardContent
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  buttonSection: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  googleButton: {
    marginBottom: 4,
  },
  demoButton: {
    marginBottom: 4,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleLogoText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
