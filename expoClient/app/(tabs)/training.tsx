import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { Image } from 'expo-image';

// Mock training data
const trainingModules = [
  {
    id: 1,
    title: 'Communication Fundamentals',
    description: 'Learn the basics of effective communication',
    progress: 0,
    image: require('@/assets/images/icon.png'),
    chapters: 5,
    exercises: 12,
  },
  {
    id: 2,
    title: 'Leadership Speaking',
    description: 'Develop your leadership voice and presence',
    progress: 0,
    image: require('@/assets/images/icon.png'),
    chapters: 4,
    exercises: 10,
  },
];

export default function TrainingScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#ffffff' : '#000000';
  
  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Training Modules</ThemedText>
          <ThemedText style={styles.subtitle}>
            Structured learning to improve your communication skills
          </ThemedText>
        </View>
        
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Your Progress</ThemedText>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <ThemedText style={styles.progressText}>0% Complete</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedText type="subtitle" style={styles.sectionTitle}>Available Modules</ThemedText>
        
        {trainingModules.map((module) => (
          <TouchableOpacity key={module.id} activeOpacity={0.7}>
            <ThemedView style={styles.moduleCard}>
              <Image source={module.image} style={styles.moduleImage} />
              <View style={styles.moduleContent}>
                <ThemedText type="defaultSemiBold" style={styles.moduleTitle}>
                  {module.title}
                </ThemedText>
                <ThemedText style={styles.moduleDescription}>
                  {module.description}
                </ThemedText>
                <View style={styles.moduleStats}>
                  <ThemedText style={styles.moduleStatText}>
                    <FontAwesome name="book" size={12} color={textColor} /> {module.chapters} Chapters
                  </ThemedText>
                  <ThemedText style={styles.moduleStatText}>
                    <FontAwesome name="tasks" size={12} color={textColor} /> {module.exercises} Exercises
                  </ThemedText>
                </View>
                <View style={styles.moduleProgressContainer}>
                  <View style={styles.moduleProgressBar}>
                    <View 
                      style={[
                        styles.moduleProgressFill, 
                        { width: `${module.progress}%` }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.moduleProgressText}>
                    {module.progress}%
                  </ThemedText>
                </View>
              </View>
            </ThemedView>
          </TouchableOpacity>
        ))}
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
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0070f3',
  },
  progressText: {
    marginTop: 8,
    textAlign: 'right',
    fontSize: 14,
  },
  sectionTitle: {
    marginVertical: 16,
  },
  moduleCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  moduleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  moduleDescription: {
    opacity: 0.7,
    marginBottom: 8,
    fontSize: 14,
  },
  moduleStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  moduleStatText: {
    fontSize: 12,
    marginRight: 12,
    opacity: 0.7,
  },
  moduleProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  moduleProgressFill: {
    height: '100%',
    backgroundColor: '#0070f3',
  },
  moduleProgressText: {
    fontSize: 12,
    width: 30,
  },
});
