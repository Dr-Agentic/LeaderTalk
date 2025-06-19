import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  Platform,
  Text,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle } from '../src/lib/supabaseAuth';
import { signInWithDemo } from '../src/lib/demoAuth';
import { router } from 'expo-router';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Animation values for the glowing orbs
  const purpleOpacity = new Animated.Value(0.7);
  const pinkOpacity = new Animated.Value(0.7);
  const purpleScale = new Animated.Value(1);
  const pinkScale = new Animated.Value(1);
  
  // Animation value for the card
  const cardOpacity = new Animated.Value(0);
  const cardTranslateY = new Animated.Value(20);
  
  // Set up animations
  useEffect(() => {
    // Card entrance animation
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Purple glow animation - pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(purpleOpacity, {
            toValue: 0.9,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(purpleScale, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(purpleOpacity, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(purpleScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();
    
    // Pink glow animation with delay - pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pinkOpacity, {
            toValue: 0.9,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pinkScale, {
            toValue: 1.1,
            duration: 3000,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(pinkOpacity, {
            toValue: 0.7,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pinkScale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log("Google sign-in button pressed");
      setLoading(true);
      setInitError(null);
      
      await signInWithGoogle();
      
      // If successful, navigate to the dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setInitError(error.message || 'Failed to sign in with Google');
      
      // Show error in an alert
      Alert.alert(
        "Sign In Failed",
        `Error: ${error.message || 'Unknown error'}`,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      console.log("Demo sign-in button pressed");
      setDemoLoading(true);
      setInitError(null);
      
      await signInWithDemo();
      
      // If successful, navigate to the dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Demo sign-in error:", error);
      setInitError(error.message || 'Failed to sign in with demo account');
      
      // Show error in an alert
      Alert.alert(
        "Demo Sign In Failed",
        `Error: ${error.message || 'Unknown error'}`,
        [{ text: "OK" }]
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#111827', '#4B2D6F', '#111827']} // from-gray-900 via-purple-900/20 to-gray-900
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        <Animated.View 
          style={[
            styles.purpleGlow, 
            { 
              opacity: purpleOpacity,
              transform: [{ scale: purpleScale }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.pinkGlow, 
            { 
              opacity: pinkOpacity,
              transform: [{ scale: pinkScale }]
            }
          ]} 
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.cardContainer,
            { 
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }]
            }
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.2)', 'rgba(236, 72, 153, 0.2)']} // from-purple-600/20 to-pink-500/20
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title}>
                  Welcome to LeaderTalk
                </Text>
                <Text style={styles.description}>
                  Transform your communication skills with AI-powered coaching
                </Text>
              </View>
              
              <View style={styles.cardContent}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading || demoLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#8A2BE2', '#FF6B6B']} // cta-button gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#fff" size="small" style={styles.loader} />
                        <Text style={styles.buttonText}>Signing in...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Image 
                          source={require('../assets/images/google-logo.png')} 
                          style={styles.googleLogo} 
                        />
                        <Text style={styles.buttonText}>Sign in with Google</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>
                
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={handleDemoSignIn}
                  disabled={loading || demoLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {demoLoading ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color="#fff" size="small" style={styles.loader} />
                        <Text style={styles.buttonText}>Accessing Demo...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.buttonText}>Enter Demo Mode</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                {initError && (
                  <Text style={styles.errorText}>
                    {initError}
                  </Text>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  purpleGlow: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: width * 0.6, // Responsive size
    height: width * 0.6,
    backgroundColor: 'rgba(124, 58, 237, 0.1)', // bg-purple-600/10
    borderRadius: width * 0.6, // Make it circular
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pinkGlow: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: width * 0.6, // Responsive size
    height: width * 0.6,
    backgroundColor: 'rgba(236, 72, 153, 0.1)', // bg-pink-500/10
    borderRadius: width * 0.6, // Make it circular
    ...Platform.select({
      ios: {
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.3)', // border-purple-600/30
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  gradientCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
  },
  cardHeader: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)', // text-white/70
    textAlign: 'center',
    fontSize: 16,
  },
  cardContent: {
    padding: 24,
    paddingTop: 0,
  },
  googleButton: {
    width: '100%',
    height: 48, // min-height: 48px from web
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  demoButton: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginRight: 10,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
});
