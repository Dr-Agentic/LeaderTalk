import fs from 'fs';
import path from 'path';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { situationAttempts } from '../../shared/schema';
import { evaluationService, type ScenarioContext, type EvaluationResult } from './evaluationService';

export interface TrainingSubmission {
  scenarioId: number;
  userResponse: string;
  userId: number;
}

export interface CompleteScenario {
  id: number;
  description: string;
  userPrompt: string;
  moduleTitle: string;
  leadershipTrait: string;
  situationType: string;
  requiredLeadershipStyle: 'empathetic' | 'inspirational' | 'commanding';
}

export class TrainingService {
  /**
   * Process a complete training submission with AI evaluation
   */
  async processTrainingSubmission(submission: TrainingSubmission): Promise<{
    success: boolean;
    attemptId?: number;
    evaluation?: EvaluationResult;
    error?: string;
  }> {
    try {
      // 1. Get complete scenario context
      const scenario = await this.getCompleteScenario(submission.scenarioId);
      if (!scenario) {
        return { success: false, error: 'Scenario not found' };
      }

      // 2. Assign leadership style based on scenario ID
      const requiredStyle = this.assignLeadershipStyle(submission.scenarioId);
      scenario.requiredLeadershipStyle = requiredStyle;

      // 3. Get AI evaluation
      const evaluation = await evaluationService.evaluateResponse(
        submission.userResponse,
        scenario
      );

      // 4. Store in database
      const attemptData = {
        userId: submission.userId,
        situationId: submission.scenarioId,
        response: submission.userResponse,
        leadershipStyle: requiredStyle,
        score: evaluation.score,
        feedback: evaluation.feedback,
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          styleAlignment: evaluation.styleAlignment,
          overallAssessment: evaluation.overallAssessment
        }
      };

      const result = await db
        .insert(situationAttempts)
        .values(attemptData)
        .returning();

      return {
        success: true,
        attemptId: result[0].id,
        evaluation
      };
    } catch (error) {
      console.error('Error processing training submission:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get complete scenario data from JSON files
   */
  private async getCompleteScenario(scenarioId: number): Promise<CompleteScenario | null> {
    try {
      const chapterFiles = [
        'chapter1_expanded.json',
        'chapter2_expanded.json',
        'chapter3_expanded.json',
        'chapter4_expanded.json',
        'chapter5_expanded.json'
      ];

      for (const fileName of chapterFiles) {
        const filePath = path.join(process.cwd(), 'attached_assets', fileName);
        
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const chapterData = JSON.parse(rawData);

        // Search through modules and scenarios
        for (const module of chapterData.modules || []) {
          for (const scenario of module.scenarios || []) {
            if (scenario.id === scenarioId) {
              return {
                id: scenario.id,
                description: scenario.description,
                userPrompt: scenario.user_prompt,
                moduleTitle: module.module_title,
                leadershipTrait: module.leadership_trait,
                situationType: module.situation_type,
                requiredLeadershipStyle: 'empathetic' // Will be overridden
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error loading scenario:', error);
      return null;
    }
  }

  /**
   * Assign leadership style based on scenario ID (consistent assignment)
   */
  private assignLeadershipStyle(scenarioId: number): 'empathetic' | 'inspirational' | 'commanding' {
    const styles: ('empathetic' | 'inspirational' | 'commanding')[] = [
      'empathetic',
      'inspirational', 
      'commanding'
    ];
    return styles[scenarioId % 3];
  }

  /**
   * Get user's attempts for a specific scenario
   */
  async getUserAttempts(userId: number, scenarioId?: number) {
    try {
      let query = db
        .select()
        .from(situationAttempts)
        .where(eq(situationAttempts.userId, userId));

      if (scenarioId) {
        query = query.where(eq(situationAttempts.situationId, scenarioId));
      }

      return await query.orderBy(desc(situationAttempts.createdAt));
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      return [];
    }
  }
}

export const trainingService = new TrainingService();