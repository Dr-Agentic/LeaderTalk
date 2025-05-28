import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, ProgressBar, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';

// Define the chapter type
interface Chapter {
  id: number;
  title: string;
  description: string;
  modules: Module[];
  progress: number;
}

interface Module {
  id: number;
  title: string;
  description: string;
  situationCount: number;
  completedSituations: number;
}

export default function TrainingScreen() {
  const navigation = useNavigation();
  
  // Fetch chapters
  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['training', 'chapters'],
    queryFn: () => apiRequest<Chapter[]>('GET', '/api/training/chapters'),
  });

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (chapters.length === 0) return 0;
    
    const totalProgress = chapters.reduce((sum, chapter) => sum + chapter.progress, 0);
    return totalProgress / chapters.length;
  };

  // Render a module card
  const renderModuleCard = ({ item, chapterId }: { item: Module, chapterId: number }) => {
    const progress = item.situationCount > 0 ? item.completedSituations / item.situationCount : 0;
    
    return (
      <Card 
        style={styles.moduleCard} 
        onPress={() => navigation.navigate('ModuleView', { moduleId: item.id, chapterId })}
      >
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph numberOfLines={2}>{item.description}</Paragraph>
          
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} color="#e53e3e" style={styles.progressBar} />
            <Text style={styles.progressText}>
              {item.completedSituations}/{item.situationCount} Completed
            </Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button 
            onPress={() => navigation.navigate('ModuleView', { moduleId: item.id, chapterId })}
          >
            Continue
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  // Render a chapter card
  const renderChapterCard = ({ item }: { item: Chapter }) => (
    <Card style={styles.chapterCard}>
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>{item.description}</Paragraph>
        
        <View style={styles.progressContainer}>
          <ProgressBar progress={item.progress} color="#e53e3e" style={styles.progressBar} />
          <Text style={styles.progressText}>{Math.round(item.progress * 100)}% Complete</Text>
        </View>
      </Card.Content>
      
      <View style={styles.modulesContainer}>
        <Text style={styles.modulesTitle}>Modules</Text>
        {item.modules.map((module) => (
          renderModuleCard({ item: module, chapterId: item.id })
        ))}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centered}>
          <Text>Loading training content...</Text>
        </View>
      ) : chapters.length === 0 ? (
        <View style={styles.centered}>
          <Text>No training content available.</Text>
        </View>
      ) : (
        <>
          <Card style={styles.overallProgressCard}>
            <Card.Content>
              <Title>Overall Progress</Title>
              <ProgressBar 
                progress={calculateOverallProgress()} 
                color="#e53e3e" 
                style={styles.overallProgressBar} 
              />
              <Text style={styles.overallProgressText}>
                {Math.round(calculateOverallProgress() * 100)}% Complete
              </Text>
            </Card.Content>
          </Card>
          
          <FlatList
            data={chapters}
            renderItem={renderChapterCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  overallProgressCard: {
    margin: 16,
    marginBottom: 8,
  },
  overallProgressBar: {
    marginTop: 8,
    height: 10,
    borderRadius: 5,
  },
  overallProgressText: {
    marginTop: 4,
    textAlign: 'right',
  },
  chapterCard: {
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  modulesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  modulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  moduleCard: {
    marginBottom: 8,
  },
});
