import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { apiRequest } from '../lib/api';

// Placeholder component for leader selection
const LeaderOption = ({ leader, selected, onToggle }: { 
  leader: { id: number; name: string; description: string }; 
  selected: boolean; 
  onToggle: () => void 
}) => (
  <TouchableOpacity 
    style={[styles.leaderOption, selected && styles.leaderOptionSelected]} 
    onPress={onToggle}
  >
    <Text style={[styles.leaderName, selected && styles.leaderNameSelected]}>
      {leader.name}
    </Text>
    <Text style={[styles.leaderDescription, selected && styles.leaderDescriptionSelected]}>
      {leader.description}
    </Text>
  </TouchableOpacity>
);

const OnboardingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profession, setProfession] = useState('');
  const [goals, setGoals] = useState('');
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sample leaders data (would be fetched from API in real implementation)
  const leaders = [
    { id: 1, name: 'Barack Obama', description: 'Known for inspirational and inclusive communication' },
    { id: 2, name: 'Oprah Winfrey', description: 'Master of empathetic and engaging conversation' },
    { id: 3, name: 'Elon Musk', description: 'Direct and visionary technical communicator' },
    { id: 4, name: 'Brené Brown', description: 'Authentic and vulnerable storytelling' },
    { id: 5, name: 'Simon Sinek', description: 'Purpose-driven and clear conceptual communication' },
  ];
  
  const toggleLeader = (leaderId: number) => {
    setSelectedLeaders(prev => 
      prev.includes(leaderId) 
        ? prev.filter(id => id !== leaderId) 
        : [...prev, leaderId]
    );
  };
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Submit onboarding data to API
      await apiRequest('POST', '/api/users/onboarding', {
        dateOfBirth,
        profession,
        goals,
        selectedLeaders
      });
      
      // Navigate to main app
      // Navigation will be handled by the auth state listener in App.tsx
      // which will detect that onboarding is complete
    } catch (error) {
      console.error('Failed to submit onboarding data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#1a1a2e']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Profession</Text>
                <TextInput
                  style={styles.input}
                  value={profession}
                  onChangeText={setProfession}
                  placeholder="Your profession"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>
          )}
          
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Your Communication Goals</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>What do you want to improve?</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={goals}
                  onChangeText={setGoals}
                  placeholder="Describe your communication goals..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}
          
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Leaders to Emulate</Text>
              <Text style={styles.stepDescription}>
                Choose leaders whose communication style you admire and would like to learn from.
              </Text>
              
              <View style={styles.leadersContainer}>
                {leaders.map(leader => (
                  <LeaderOption
                    key={leader.id}
                    leader={leader}
                    selected={selectedLeaders.includes(leader.id)}
                    onToggle={() => toggleLeader(leader.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              disabled={isSubmitting}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          {step < 3 ? (
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextButton, isSubmitting && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.nextButtonText}>
                {isSubmitting ? 'Submitting...' : 'Complete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  leadersContainer: {
    gap: 12,
  },
  leaderOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaderOptionSelected: {
    backgroundColor: 'rgba(126, 34, 206, 0.3)',
    borderColor: '#7e22ce',
  },
  leaderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  leaderNameSelected: {
    color: '#fff',
  },
  leaderDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  leaderDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#7e22ce',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default OnboardingScreen;
