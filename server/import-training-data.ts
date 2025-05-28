import { db } from './db';
import { chapters, modules } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

interface StyleResponses {
  empathetic: string;
  inspirational: string;
  commanding: string;
}

interface Scenario {
  id: number;
  description: string;
  style_responses: StyleResponses;
  user_prompt: string;
}

interface Module {
  id?: number;
  order?: number;
  module_title: string;
  leadership_trait: string;
  situation_type: string;
  scenarios: Scenario[];
}

interface Chapter {
  id?: number;
  order?: number;
  chapter_title: string;
  modules: Module[];
}

interface LearningPath {
  leadership_styles: {
    empathetic: { description: string };
    inspirational: { description: string };
    commanding: { description: string };
  };
  learning_path: Chapter[];
}

export async function importTrainingData() {
  try {
    // First check if we already have data to avoid duplicates
    const existingChapters = await db.select().from(chapters);
    if (existingChapters.length > 0) {
      console.log('Training data already imported, skipping import');
      return;
    }
    
    // Load each chapter file
    const chapterFiles = [
      'chapter1_expanded.json',
      'chapter2_expanded.json',
      'chapter3_expanded.json',
      'chapter4_expanded.json',
      'chapter5_expanded.json'
    ];
    
    let learningPath: Chapter[] = [];
    
    for (const chapterFile of chapterFiles) {
      const filePath = path.join(__dirname, '..', 'attached_assets', chapterFile);
      
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const chapterData: Chapter = JSON.parse(rawData);
        learningPath.push(chapterData);
        console.log(`Loaded chapter from ${chapterFile}`);
      } else {
        console.warn(`Chapter file not found: ${chapterFile}`);
      }
    }
    
    if (learningPath.length === 0) {
      console.log('No chapter files found, using embedded sample data');
      // Use the minimal sample data as fallback
      learningPath = [
        {
          id: 1,
          order: 1,
          chapter_title: "Chapter 1: Foundations of Leadership Communication",
          modules: [
            {
              id: 1,
              order: 1,
              module_title: "Managing Conflict with Confidence",
              leadership_trait: "Conflict Resolution",
              situation_type: "Interpersonal Conflict",
              scenarios: [
                {
                  id: 1,
                  description: "Two team members are blaming each other for missing a deadline in a public meeting.",
                  style_responses: {
                    empathetic: "I understand you're both frustrated. Let's take a moment to understand each perspective without blame. What support did each of you need that might have been missing?",
                    inspirational: "Deadlines can be missed, but how we show up in moments like this defines us as a team. Let's turn this setback into an opportunity to build something better—together.",
                    commanding: "This isn't the time for finger-pointing. We missed the mark. Here's what we'll do next: regroup, identify blockers, and fix it. Now let's move."
                  },
                  user_prompt: "How would *you* respond as a leader in this situation? Type or dictate your response."
                }
              ]
            }
          ]
        }
      ];
    }

    // Import the data into our database
    for (const chapterData of learningPath) {
      // Insert the chapter
      const [newChapter] = await db.insert(chapters).values({
        id: chapterData.id,
        title: chapterData.chapter_title,
        description: '',
        order: chapterData.order || 1
      }).returning();
      
      console.log(`Imported chapter: ${chapterData.chapter_title}`);
      
      // Insert each module in the chapter
      for (const moduleData of chapterData.modules) {
        const [newModule] = await db.insert(modules).values({
          id: moduleData.id,
          chapterId: newChapter.id,
          title: moduleData.module_title,
          description: '',
          leadershipTrait: moduleData.leadership_trait,
          situationType: moduleData.situation_type,
          order: moduleData.order || 1
        }).returning();
        
        console.log(`Imported module: ${moduleData.module_title}`);
        
        // Note: Situations are now loaded from JSON files directly, not stored in database
        console.log(`Module has ${moduleData.scenarios.length} scenarios available in JSON`);
      }
    }
    
    console.log('Training data import completed successfully');
  } catch (error) {
    console.error('Error importing training data:', error);
    throw error;
  }
}