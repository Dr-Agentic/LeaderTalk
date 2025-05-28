import { Express, Request, Response } from "express";
import { db } from "../db";
import { 
  situationAttempts,
  userProgress,
  insertSituationAttemptSchema,
  insertUserProgressSchema
} from "@shared/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';
import { TrainingService } from "../services/trainingService";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

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
  // JSON-based endpoints
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
      res.status(500).json({ error: "Failed to load chapters" });
    }
  });

  app.get("/api/training/chapters/:chapterId", requireAuth, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      const chapterData = loadChapterData(chapterId);
      res.json(chapterData);
    } catch (error) {
      res.status(404).json({ error: "Chapter not found" });
    }
  });

  app.get("/api/training/chapters/:chapterId/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      const moduleId = parseInt(req.params.moduleId);
      
      const chapterData = loadChapterData(chapterId);
      const module = chapterData.modules.find((m: any) => m.id === moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      res.json(module);
    } catch (error) {
      res.status(404).json({ error: "Module not found" });
    }
  });

  app.get("/api/training/chapters/:chapterId/modules/:moduleId/situations/:situationId", requireAuth, async (req, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      const moduleId = parseInt(req.params.moduleId);
      const situationId = parseInt(req.params.situationId);
      
      const chapterData = loadChapterData(chapterId);
      const module = chapterData.modules.find((m: any) => m.id === moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      const situation = module.scenarios.find((s: any) => s.id === situationId);
      
      if (!situation) {
        return res.status(404).json({ error: "Situation not found" });
      }
      
      // Randomly assign one of the three leadership styles
      const leadershipStyles = ["empathetic", "inspirational", "commanding"];
      const randomStyle = leadershipStyles[Math.floor(Math.random() * leadershipStyles.length)];
      
      res.json({
        ...situation,
        chapterId,
        moduleId,
        assignedLeadershipStyle: randomStyle
      });
    } catch (error) {
      res.status(404).json({ error: "Situation not found" });
    }
  });

  // AI Evaluation endpoint
  app.post("/api/training/submit-with-ai-evaluation", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { situationId, response, leadershipStyle } = req.body;

      if (!situationId || !response) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Initialize training service
      const trainingService = new TrainingService();

      // Process the submission with AI evaluation
      const result = await trainingService.processTrainingSubmission({
        scenarioId: situationId,
        userResponse: response,
        userId: userId
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to process submission" });
      }

      // Return the evaluation data with cache invalidation hints
      res.json({
        success: true,
        attemptId: result.attemptId,
        evaluation: result.evaluation,
        invalidateCache: [
          `/api/training/module/${situationId}/stats`,
          `/api/training/situation/${situationId}/stats`,
          `/api/training/attempts`
        ]
      });

    } catch (error) {
      console.error("AI evaluation submission error:", error);
      res.status(500).json({ error: "Failed to process AI evaluation" });
    }
  });

  // Database-based endpoints
  app.post("/api/training/submit", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const attemptData = insertSituationAttemptSchema.parse({
        ...req.body,
        userId
      });
      
      const attemptRecord = await db
        .insert(situationAttempts)
        .values(attemptData)
        .returning();
      
      res.json(attemptRecord[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit training" });
    }
  });

  app.get("/api/training/attempts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });

  app.get("/api/training/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const progress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(desc(userProgress.createdAt));
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Get statistics for a specific situation (last attempt's score)
  app.get("/api/training/situation/:situationId/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const situationId = parseInt(req.params.situationId);
      
      // Get the most recent attempt for this situation
      const latestAttempt = await db
        .select()
        .from(situationAttempts)
        .where(
          and(
            eq(situationAttempts.userId, userId),
            eq(situationAttempts.situationId, situationId)
          )
        )
        .orderBy(desc(situationAttempts.createdAt))
        .limit(1);
      
      if (latestAttempt.length === 0) {
        return res.json({
          status: "not-started",
          score: null,
          completedAt: null
        });
      }
      
      const attempt = latestAttempt[0];
      const overallScore = attempt.evaluation?.overallScore || 0;
      
      res.json({
        status: overallScore >= 70 ? "completed" : "failed",
        score: overallScore,
        completedAt: attempt.createdAt,
        evaluation: attempt.evaluation
      });
    } catch (error) {
      console.error("Error fetching situation stats:", error);
      res.status(500).json({ error: "Failed to fetch situation statistics" });
    }
  });

  // Get statistics for a module (aggregating all situations in the module)
  app.get("/api/training/module/:moduleId/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const moduleId = parseInt(req.params.moduleId);
      
      // First, get the module data to know which situations belong to it
      const chapterId = parseInt(req.query.chapterId as string);
      if (!chapterId) {
        return res.status(400).json({ error: "chapterId is required" });
      }
      
      const chapterData = loadChapterData(chapterId);
      const module = chapterData.modules.find((m: any) => m.id === moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      const situationIds = module.scenarios.map((s: any) => s.id);
      
      // Get latest attempts for all situations in this module
      const attempts = await db
        .select()
        .from(situationAttempts)
        .where(
          and(
            eq(situationAttempts.userId, userId),
            inArray(situationAttempts.situationId, situationIds)
          )
        )
        .orderBy(desc(situationAttempts.createdAt));
      
      // Group by situation ID and get the latest attempt for each
      const latestAttempts = new Map();
      attempts.forEach(attempt => {
        if (!latestAttempts.has(attempt.situationId)) {
          latestAttempts.set(attempt.situationId, attempt);
        }
      });
      
      const completedSituations = Array.from(latestAttempts.values())
        .filter(attempt => (attempt.evaluation?.overallScore || 0) >= 70);
      
      const totalSituations = situationIds.length;
      const completedCount = completedSituations.length;
      const averageScore = latestAttempts.size > 0 
        ? Math.round(Array.from(latestAttempts.values())
            .reduce((sum, attempt) => sum + (attempt.evaluation?.overallScore || 0), 0) / latestAttempts.size)
        : 0;
      
      res.json({
        totalSituations,
        completedSituations: completedCount,
        completionPercentage: Math.round((completedCount / totalSituations) * 100),
        averageScore,
        situationStats: situationIds.map(id => {
          const attempt = latestAttempts.get(id);
          return {
            situationId: id,
            status: attempt 
              ? (attempt.evaluation?.overallScore >= 70 ? "completed" : "failed")
              : "not-started",
            score: attempt?.evaluation?.overallScore || null,
            completedAt: attempt?.createdAt || null
          };
        })
      });
    } catch (error) {
      console.error("Error fetching module stats:", error);
      res.status(500).json({ error: "Failed to fetch module statistics" });
    }
  });

  // Get statistics for a chapter (aggregating all modules in the chapter)
  app.get("/api/training/chapter/:chapterId/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const chapterId = parseInt(req.params.chapterId);
      
      const chapterData = loadChapterData(chapterId);
      
      // Get all situation IDs from all modules in this chapter
      const allSituationIds: number[] = [];
      chapterData.modules.forEach((module: any) => {
        module.scenarios.forEach((scenario: any) => {
          allSituationIds.push(scenario.id);
        });
      });
      
      // Get latest attempts for all situations in this chapter
      const attempts = await db
        .select()
        .from(situationAttempts)
        .where(
          and(
            eq(situationAttempts.userId, userId),
            inArray(situationAttempts.situationId, allSituationIds)
          )
        )
        .orderBy(desc(situationAttempts.createdAt));
      
      // Group by situation ID and get the latest attempt for each
      const latestAttempts = new Map();
      attempts.forEach(attempt => {
        if (!latestAttempts.has(attempt.situationId)) {
          latestAttempts.set(attempt.situationId, attempt);
        }
      });
      
      const completedSituations = Array.from(latestAttempts.values())
        .filter(attempt => (attempt.evaluation?.overallScore || 0) >= 70);
      
      const totalSituations = allSituationIds.length;
      const completedCount = completedSituations.length;
      const averageScore = latestAttempts.size > 0 
        ? Math.round(Array.from(latestAttempts.values())
            .reduce((sum, attempt) => sum + (attempt.evaluation?.overallScore || 0), 0) / latestAttempts.size)
        : 0;
      
      // Calculate module-level stats
      const moduleStats = chapterData.modules.map((module: any) => {
        const moduleSituationIds = module.scenarios.map((s: any) => s.id);
        const moduleAttempts = moduleSituationIds
          .map(id => latestAttempts.get(id))
          .filter(Boolean);
        
        const moduleCompleted = moduleAttempts
          .filter(attempt => (attempt.evaluation?.overallScore || 0) >= 70).length;
        
        return {
          moduleId: module.id,
          totalSituations: moduleSituationIds.length,
          completedSituations: moduleCompleted,
          completionPercentage: Math.round((moduleCompleted / moduleSituationIds.length) * 100),
          averageScore: moduleAttempts.length > 0
            ? Math.round(moduleAttempts.reduce((sum, attempt) => 
                sum + (attempt.evaluation?.overallScore || 0), 0) / moduleAttempts.length)
            : 0
        };
      });
      
      res.json({
        totalSituations,
        completedSituations: completedCount,
        completionPercentage: Math.round((completedCount / totalSituations) * 100),
        averageScore,
        moduleStats
      });
    } catch (error) {
      console.error("Error fetching chapter stats:", error);
      res.status(500).json({ error: "Failed to fetch chapter statistics" });
    }
  });

  app.post("/api/training/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
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
      res.status(500).json({ error: "Failed to save progress" });
    }
  });
}