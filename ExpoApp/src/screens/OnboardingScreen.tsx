import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, TextInput, Chip, Title, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

// Define the leader type
interface Leader {
  id: number;
  name: string;
  description: string;
  isControversial: boolean;
}

// Define the onboarding data type
interface OnboardingData {
  dateOfBirth: string;
  profession: string;
  goals: string;
  selectedLeaders: number[];
}

export default function OnboardingScreen() {
  // State for form fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profession, setProfession] = useState('');
  const [goals, setGoals] = useState('');
  const [selectedLeaders, setSelectedLeaders] = useState<number[]>([]);
  const [showControversial, setShowControversial] = useState(false);
  const [step, setStep] = useState(1);

  // Fetch available leaders
  const { data: leaders = [], isLoading: leadersLoading } = useQuery({
    queryKey: ['leaders'],
    queryFn: () => apiRequest<Leader[]>('GET', '/api/leaders'),
  });

  // Filter leaders based on controversial setting
  const filteredLeaders = showControversial 
    ? leaders 
    : leaders.filter(leader => !leader.isControversial);

  // Mutation for submitting onboarding data
  const { mutate: submitOnboarding, isPending } = useMutation({
    mutationFn: (data: OnboardingData) => 
      apiRequest('PATCH', '/api/users/me', data),
    onSuccess: () => {
      // Onboarding complete - the AppNavigator will handle navigation
    },
  });

  // Handle leader selection/deselection
  const toggleLeader = (leaderId: number) => {
    if (selectedLeaders.includes(leaderId)) {
      setSelectedLeaders(selectedLeaders.filter(id => id !== leaderId));
    } else {
      // Limit to max 3 leaders
      if (selectedLeaders.length < 3) {
        setSelectedLeaders([...selectedLeaders, leaderId]);
      }
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    submitOnboarding({
      dateOfBirth,
      profession,
      goals,
      selectedLeaders,
    });
  };

  // Render step 1 - Personal information
  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <Title style={styles.title}>Tell us about yourself</Title>
      
      <TextInput
        label="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Profession"
        value={profession}
        onChangeText={setProfession}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Communication Goals"
        value={goals}
        onChangeText={setGoals}
        multiline
        numberOfLines={4}
        style={styles.input}
        mode="outlined"
      />
      
      <Button 
        mode="contained" 
        onPress={() => setStep(2)}
        disabled={!dateOfBirth || !profession || !goals}
        style={styles.button}
      >
        Next
      </Button>
    </View>
  );

  // Render step 2 - Leader selection
  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <Title style={styles.title}>Select your leadership inspiration</Title>
      <Paragraph style={styles.subtitle}>
        Choose 1-3 leaders whose communication style you'd like to emulate
      </Paragraph>
      
      <Button
        mode="outlined"
        onPress={() => setShowControversial(!showControversial)}
        style={styles.toggleButton}
      >
        {showControversial ? 'Hide Controversial Leaders' : 'Show All Leaders'}
      </Button>
      
      {leadersLoading ? (
        <Text>Loading leaders...</Text>
      ) : (
        <ScrollView style={styles.leadersList}>
          <View style={styles.chipsContainer}>
            {filteredLeaders.map((leader) => (
              <Chip
                key={leader.id}
                selected={selectedLeaders.includes(leader.id)}
                onPress={() => toggleLeader(leader.id)}
                style={styles.chip}
                selectedColor="#e53e3e"
              >
                {leader.name}
              </Chip>
            ))}
          </View>
        </ScrollView>
      )}
      
      <View style={styles.buttonRow}>
        <Button 
          mode="outlined" 
          onPress={() => setStep(1)}
          style={[styles.button, styles.backButton]}
        >
          Back
        </Button>
        
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          disabled={selectedLeaders.length === 0 || isPending}
          style={[styles.button, styles.submitButton]}
          loading={isPending}
        >
          Complete
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 1 ? renderStep1() : renderStep2()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  toggleButton: {
    marginBottom: 16,
  },
  leadersList: {
    flex: 1,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    marginLeft: 8,
  },
});
