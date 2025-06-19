import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';

export default function LeaderTalkScreen() {
  return (
    <ThemedView style={styles.container}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <ThemedText type="title" style={styles.title}>
        LeaderTalk
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Communication Coaching Platform
      </ThemedText>
      
      <ThemedView style={styles.featureContainer}>
        <ThemedText type="subtitle">Key Features</ThemedText>
        
        <ThemedView style={styles.feature}>
          <ThemedText type="defaultSemiBold">Speech Analysis</ThemedText>
          <ThemedText>Record conversations and get AI-powered feedback</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.feature}>
          <ThemedText type="defaultSemiBold">Leadership Insights</ThemedText>
          <ThemedText>Learn from communication styles of selected leaders</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.feature}>
          <ThemedText type="defaultSemiBold">Training Modules</ThemedText>
          <ThemedText>Practice with structured learning scenarios</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 40,
    opacity: 0.8,
  },
  featureContainer: {
    width: '100%',
    gap: 20,
  },
  feature: {
    backgroundColor: 'rgba(161, 206, 220, 0.2)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
});
