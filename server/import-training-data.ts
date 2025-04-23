import { db } from './db';
import { chapters, modules, situations } from '@shared/schema';
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
  module_title: string;
  leadership_trait: string;
  situation_type: string;
  scenarios: Scenario[];
}

interface Chapter {
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
    const filePath = path.join(__dirname, '..', 'attached_assets', 'training_data.json');
    
    // Check if file exists, if not, use the data we have
    let learningPathData: LearningPath;
    
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      learningPathData = JSON.parse(rawData);
    } else {
      console.log('Training data file not found, using embedded data');
      // Use the sample data from the text file
      learningPathData = {
        leadership_styles: {
          empathetic: {
            description: "Focuses on understanding, listening, and emotional intelligence to build trust and resolve tensions."
          },
          inspirational: {
            description: "Uses passion, purpose, and big-picture thinking to elevate and motivate in moments of challenge."
          },
          commanding: {
            description: "Acts with authority, clarity, and direction, especially in high-pressure or urgent situations."
          }
        },
        learning_path: [
          {
            chapter_title: "Chapter 1: Foundations of Leadership Communication",
            modules: [
              {
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
                  },
                  {
                    id: 2,
                    description: "A high-performing employee is in open conflict with their manager over creative direction.",
                    style_responses: {
                      empathetic: "I hear that you're both passionate about this project. Let's sit down together, hear each side, and find a common ground that respects both perspectives.",
                      inspirational: "Conflict often means people care deeply. Let's channel that energy into creating something bold, together. Can we align on the big picture?",
                      commanding: "This debate is slowing the team. We need alignment now. We'll review both approaches, make a call, and move forward with discipline."
                    },
                    user_prompt: "What would you say to de-escalate and realign your team? Speak or type your answer."
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    // First, check if we already have data to avoid duplicates
    const existingChapters = await db.select().from(chapters);
    if (existingChapters.length > 0) {
      console.log('Training data already imported, skipping import');
      return;
    }

    // Import the data into our database
    for (let chapterIndex = 0; chapterIndex < learningPathData.learning_path.length; chapterIndex++) {
      const chapterData = learningPathData.learning_path[chapterIndex];
      
      // Insert the chapter
      const [newChapter] = await db.insert(chapters).values({
        title: chapterData.chapter_title,
        description: '',
        order: chapterIndex + 1
      }).returning();
      
      console.log(`Imported chapter: ${chapterData.chapter_title}`);
      
      // Insert each module in the chapter
      for (let moduleIndex = 0; moduleIndex < chapterData.modules.length; moduleIndex++) {
        const moduleData = chapterData.modules[moduleIndex];
        
        const [newModule] = await db.insert(modules).values({
          chapterId: newChapter.id,
          title: moduleData.module_title,
          description: '',
          leadershipTrait: moduleData.leadership_trait,
          situationType: moduleData.situation_type,
          order: moduleIndex + 1
        }).returning();
        
        console.log(`Imported module: ${moduleData.module_title}`);
        
        // Insert each situation in the module
        for (let scenarioIndex = 0; scenarioIndex < moduleData.scenarios.length; scenarioIndex++) {
          const scenarioData = moduleData.scenarios[scenarioIndex];
          
          await db.insert(situations).values({
            moduleId: newModule.id,
            description: scenarioData.description,
            userPrompt: scenarioData.user_prompt,
            styleResponses: scenarioData.style_responses,
            order: scenarioIndex + 1
          });
          
          console.log(`Imported situation: ${scenarioData.description.substring(0, 30)}...`);
        }
      }
    }
    
    console.log('Training data import completed successfully');
  } catch (error) {
    console.error('Error importing training data:', error);
    throw error;
  }
}