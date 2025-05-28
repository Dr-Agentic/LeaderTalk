import { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  situationAttempts,
  userProgress,
  insertSituationAttemptSchema,
  insertUserProgressSchema
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import * as fs from 'fs';
import * as path from 'path';
import { trainingService } from "../services/trainingService";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Helper to load chapter data from JSON files
function loadChapterData(chapterNumber: number) {
  const projectRoot = process.cwd();
  const filePath = path.join(projectRoot, 'attached_assets', `chapter${chapterNumber}_expanded.json`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Chapter ${chapterNumber} file not found`);
  }
  
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
}

export function registerTrainingRoutes(app: Express) {
  // Get all chapters from JSON files
  app.get("/api/training/chapters", requireAuth, async (req, res) => {
    try {
      const chapters = [];
      
      for (let i = 1; i <= 5; i++) {
        try {
          const chapterData = loadChapterData(i);
          chapters.push(chapterData);
        } catch (error) {
          console.warn(`Chapter ${i} not found`);
        }
      }
      
      res.json(chapters);
    } catch (error) {
      console.error("Error loading chapters:", error);
      res.status(500).json({ error: "Failed to load chapters" });
    }
  });

  // Get specific chapter from JSON
  app.get("/api/training/chapters/:id", requireAuth, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      const chapterData = loadChapterData(chapterId);
      res.json(chapterData);
    } catch (error) {
      console.error("Error loading chapter:", error);
      res.status(404).json({ error: "Chapter not found" });
    }
  });

  // Get specific situation from JSON
  app.get("/api/training/situations/:id", requireAuth, async (req, res) => {
    try {
      const situationId = parseInt(req.params.id);
      
      // Search through all chapters for the situation
      for (let i = 1; i <= 5; i++) {
        try {
          const chapterData = loadChapterData(i);
          for (const module of chapterData.modules) {
            for (const scenario of module.scenarios) {
              if (scenario.id === situationId) {
                return res.json({
                  ...scenario,
                  chapterId: i,
                  moduleId: module.id
                });
              }
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      res.status(404).json({ error: "Situation not found" });
    } catch (error) {
      console.error("Error loading situation:", error);
      res.status(500).json({ error: "Failed to load situation" });
    }
  });

  // Submit training response - saves to database
  app.post("/api/training/submit", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { situationId, response } = req.body;
      
      // Process with training service
      const evaluation = await trainingService.processSubmission(situationId, response);
      
      // Save attempt to database
      const attemptData = insertSituationAttemptSchema.parse({
        situationId,
        userId,
        response,
        score: evaluation.score,
        feedback: evaluation.feedback,
        leadershipStyle: evaluation.leadershipStyle,
        evaluation
      });
      
      const attemptRecord = await db
        .insert(situationAttempts)
        .values(attemptData)
        .returning();
      
      res.json({
        attempt: attemptRecord[0],
        evaluation
      });
    } catch (error) {
      console.error("Error submitting training:", error);
      res.status(500).json({ error: "Failed to submit training" });
    }
  });

  // Get user attempts from database
  app.get("/api/training/attempts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { situationId } = req.query;
      
      let query = db
        .select()
        .from(situationAttempts)
        .where(eq(situationAttempts.userId, userId))
        .orderBy(desc(situationAttempts.createdAt));
      
      if (situationId) {
        query = query.where(
          and(
            eq(situationAttempts.userId, userId),
            eq(situationAttempts.situationId, parseInt(situationId as string))
          )
        );
      }
      
      const attempts = await query;
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });

  // User progress - database operations
  app.get("/api/training/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user.id;
      
      const progress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(desc(userProgress.createdAt));
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/training/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.user.id;
      
      const progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId
      });
      
      const progressRecord = await db
        .insert(userProgress)
        .values(progressData)
        .returning();
      
      res.json(progressRecord[0]);
    } catch (error) {
      console.error("Error saving progress:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  });
}