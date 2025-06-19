import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiRequest } from '@/src/lib/queryClient';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: '1990-01-01',
    profession: '',
    goals: '',
    selectedLeaders: [],
  });

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // In a real app, you would submit the onboarding data to your API
      const response = await apiRequest('PATCH', '/api/users/me', formData);
      
      if (response.ok) {
        router.replace('/(tabs)');
      } else {
        console.error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  // For demo purposes, we'll just show a simplified onboarding flow
  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Welcome to LeaderTalk
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Let's set up your profile ({step}/3)
        </ThemedText>
        
        {step === 1 && (
          <View style={styles.stepContainer}>
            <ThemedText type="subtitle">About You</ThemedText>
            <ThemedText style={styles.description}>
              In the full app, you would enter your date of birth and profession here.
            </ThemedText>
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
            >
              <ThemedText style={styles.buttonText}>Next</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        {step === 2 && (
          <View style={styles.stepContainer}>
            <ThemedText type="subtitle">Your Goals</ThemedText>
            <ThemedText style={styles.description}>
              In the full app, you would select your communication goals here.
            </ThemedText>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <ThemedText style={styles.backButtonText}>Back</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
              >
                <ThemedText style={styles.buttonText}>Next</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {step === 3 && (
          <View style={styles.stepContainer}>
            <ThemedText type="subtitle">Select Leaders</ThemedText>
            <ThemedText style={styles.description}>
              In the full app, you would select 1-3 leaders whose communication style you admire.
            </ThemedText>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <ThemedText style={styles.backButtonText}>Back</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.button}
                onPress={handleComplete}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Completing...' : 'Complete'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#0070f3',
    borderRadius: 4,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  backButton: {
    borderColor: '#0070f3',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    width: '48%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#0070f3',
    fontSize: 16,
    fontWeight: '600',
  },
});
