import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { 
  chapters, modules, situations, userProgress, situationAttempts,
  insertChapterSchema, insertModuleSchema, insertSituationSchema,
  insertUserProgressSchema, updateUserProgressSchema,
  insertSituationAttemptSchema, AttemptEvaluation
} from "@shared/schema";
import { eq, desc, inArray, and, sql } from "drizzle-orm";
import { z } from "zod";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerTrainingRoutes(app: Express) {
  // Get all chapters
  app.get("/api/chapters", async (req, res) => {
    try {
      const allChapters = await db.select().from(chapters).orderBy(chapters.order);
      res.json(allChapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

  // Get specific chapter with modules
  app.get("/api/chapters/:id", async (req, res) => {
    try {
      const chapterId = parseInt(req.params.id);
      if (isNaN(chapterId)) {
        return res.status(400).json({ error: "Invalid chapter ID" });
      }

      const chapter = await db
        .select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);

      if (chapter.length === 0) {
        return res.status(404).json({ error: "Chapter not found" });
      }

      const chapterModules = await db
        .select()
        .from(modules)
        .where(eq(modules.chapterId, chapterId))
        .orderBy(modules.order);

      res.json({
        ...chapter[0],
        modules: chapterModules
      });
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ error: "Failed to fetch chapter" });
    }
  });

  // Get all modules
  app.get("/api/modules", async (req, res) => {
    try {
      const allModules = await db.select().from(modules).orderBy(modules.order);
      res.json(allModules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Get specific module with situations
  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      if (isNaN(moduleId)) {
        return res.status(400).json({ error: "Invalid module ID" });
      }

      const module = await db
        .select()
        .from(modules)
        .where(eq(modules.id, moduleId))
        .limit(1);

      if (module.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      const moduleSituations = await db
        .select()
        .from(situations)
        .where(eq(situations.moduleId, moduleId))
        .orderBy(situations.order);

      res.json({
        ...module[0],
        situations: moduleSituations
      });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  // Get all situations
  app.get("/api/situations", async (req, res) => {
    try {
      const allSituations = await db.select().from(situations).orderBy(situations.order);
      res.json(allSituations);
    } catch (error) {
      console.error("Error fetching situations:", error);
      res.status(500).json({ error: "Failed to fetch situations" });
    }
  });

  // Get specific situation
  app.get("/api/situations/:id", async (req, res) => {
    try {
      const situationId = parseInt(req.params.id);
      if (isNaN(situationId)) {
        return res.status(400).json({ error: "Invalid situation ID" });
      }

      const situation = await db
        .select()
        .from(situations)
        .where(eq(situations.id, situationId))
        .limit(1);

      if (situation.length === 0) {
        return res.status(404).json({ error: "Situation not found" });
      }

      res.json(situation[0]);
    } catch (error) {
      console.error("Error fetching situation:", error);
      res.status(500).json({ error: "Failed to fetch situation" });
    }
  });

  // Get user progress
  app.get("/api/user-progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const progress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(desc(userProgress.updatedAt));

      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  // Create or update user progress
  app.post("/api/user-progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId
      });

      // Check if progress already exists for this chapter/module
      const existingProgress = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.chapterId, progressData.chapterId),
            progressData.moduleId ? eq(userProgress.moduleId, progressData.moduleId) : sql`module_id IS NULL`
          )
        )
        .limit(1);

      let result;
      if (existingProgress.length > 0) {
        // Update existing progress
        result = await db
          .update(userProgress)
          .set({
            ...progressData,
            updatedAt: new Date()
          })
          .where(eq(userProgress.id, existingProgress[0].id))
          .returning();
      } else {
        // Create new progress record
        result = await db
          .insert(userProgress)
          .values(progressData)
          .returning();
      }

      res.json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error creating/updating user progress:", error);
      res.status(500).json({ error: "Failed to save user progress" });
    }
  });

  // Get situation attempts for a user
  app.get("/api/situation-attempts", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { situationId } = req.query;

      let query = db
        .select()
        .from(situationAttempts)
        .where(eq(situationAttempts.userId, userId));

      if (situationId) {
        const id = parseInt(situationId as string);
        if (!isNaN(id)) {
          query = query.where(eq(situationAttempts.situationId, id));
        }
      }

      const attempts = await query.orderBy(desc(situationAttempts.createdAt));
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching situation attempts:", error);
      res.status(500).json({ error: "Failed to fetch situation attempts" });
    }
  });

  // Submit situation attempt
  app.post("/api/situation-attempts", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate the evaluation data
      const evaluation: AttemptEvaluation = {
        score: req.body.evaluation?.score || 0,
        feedback: req.body.evaluation?.feedback || "",
        strengths: req.body.evaluation?.strengths || [],
        improvements: req.body.evaluation?.improvements || []
      };

      const attemptData = insertSituationAttemptSchema.parse({
        userId,
        situationId: req.body.situationId,
        response: req.body.response,
        evaluation
      });

      const result = await db
        .insert(situationAttempts)
        .values(attemptData)
        .returning();

      res.json(result[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error creating situation attempt:", error);
      res.status(500).json({ error: "Failed to save situation attempt" });
    }
  });

  // Get specific situation attempt
  app.get("/api/situation-attempts/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const attemptId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (isNaN(attemptId)) {
        return res.status(400).json({ error: "Invalid attempt ID" });
      }

      const attempt = await db
        .select()
        .from(situationAttempts)
        .where(
          and(
            eq(situationAttempts.id, attemptId),
            eq(situationAttempts.userId, userId)
          )
        )
        .limit(1);

      if (attempt.length === 0) {
        return res.status(404).json({ error: "Attempt not found" });
      }

      res.json(attempt[0]);
    } catch (error) {
      console.error("Error fetching situation attempt:", error);
      res.status(500).json({ error: "Failed to fetch situation attempt" });
    }
  });
}