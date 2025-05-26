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
import * as fs from 'fs';
import * as path from 'path';

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerTrainingRoutes(app: Express) {
  // Get all chapters - direct access for frontend
  app.get("/api/training/chapters-direct", requireAuth, async (req, res) => {
    try {
      // Load each chapter file
      const chapterFiles = [
        'chapter1_expanded.json',
        'chapter2_expanded.json',
        'chapter3_expanded.json',
        'chapter4_expanded.json',
        'chapter5_expanded.json'
      ];
      
      const chapters = [];
      const projectRoot = process.cwd();
      
      for (const chapterFile of chapterFiles) {
        const filePath = path.join(projectRoot, 'attached_assets', chapterFile);
        
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const chapterData = JSON.parse(rawData);
          chapters.push(chapterData);
        } else {
          console.warn(`Chapter file not found: ${filePath}`);
        }
      }
      
      // Sort chapters by their order property
      chapters.sort((a, b) => {
        const orderA = a.order || a.id;
        const orderB = b.order || b.id;
        return orderA - orderB;
      });
      
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ error: "Failed to fetch chapters" });
    }
  });

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

  // Get user progress - frontend expects this endpoint
  app.get("/api/training/progress", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const progress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(desc(userProgress.createdAt));

      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Failed to fetch user progress" });
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

  // Get next situation for direct training - frontend expects this endpoint
  // Get a specific module directly from JSON files - bypasses the database
  app.get("/api/training/modules-direct/:moduleId", requireAuth, async (req, res) => {
    try {
      const moduleId = Number(req.params.moduleId);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      // Search all chapter files for the requested module
      const chapterFiles = [
        'chapter1_expanded.json',
        'chapter2_expanded.json',
        'chapter3_expanded.json',
        'chapter4_expanded.json',
        'chapter5_expanded.json'
      ];
      
      let foundModule = null;
      let chapterId = null;
      
      // Search through all chapters to find the module
      const projectRoot = process.cwd();
      for (const chapterFile of chapterFiles) {
        const filePath = path.join(projectRoot, 'attached_assets', chapterFile);
        
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const chapterData = JSON.parse(rawData);
          
          // Find the module in this chapter
          const module = chapterData.modules.find(m => m.id === moduleId);
          if (module) {
            foundModule = {
              ...module,
              chapterId: chapterData.id,
              chapterTitle: chapterData.chapter_title
            };
            chapterId = chapterData.id;
            break;
          }
        }
      }
      
      if (!foundModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(foundModule);
    } catch (error) {
      console.error("Error fetching module:", error);
      return res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.get("/api/training/next-situation-direct", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // For now, return the first available situation
      // This can be enhanced later to track user progress and return the actual next situation
      const nextSituation = await db
        .select()
        .from(situations)
        .orderBy(situations.order)
        .limit(1);

      if (nextSituation.length === 0) {
        return res.status(404).json({ error: "No situations available" });
      }

      res.json(nextSituation[0]);
    } catch (error) {
      console.error("Error fetching next situation:", error);
      res.status(500).json({ error: "Failed to fetch next situation" });
    }
  });

  // Get a specific situation/scenario from JSON files
  app.get("/api/training/situations-direct/:situationId", (req, res) => {
    try {
      const situationId = parseInt(req.params.situationId);
      console.log(`Looking for scenario ID: ${situationId}`);
      
      // Find the scenario across all chapters and modules
      for (let chapterNum = 1; chapterNum <= 5; chapterNum++) {
        const filePath = path.join(process.cwd(), 'attached_assets', `chapter${chapterNum}_expanded.json`);
        console.log(`Checking file: ${filePath}`);
        
        if (fs.existsSync(filePath)) {
          console.log(`File exists: ${filePath}`);
          const chapterData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`Chapter ${chapterNum} has ${chapterData.modules?.length || 0} modules`);
          
          if (chapterData.modules) {
            for (const module of chapterData.modules) {
              if (module.scenarios) {
                console.log(`Module ${module.id} has ${module.scenarios.length} scenarios`);
                const scenario = module.scenarios.find((s: any) => s.id === situationId);
                if (scenario) {
                  console.log(`Found scenario ${situationId} in module ${module.id}`);
                  // Include module and chapter info for context
                  return res.json({
                    ...scenario,
                    userPrompt: scenario.user_prompt, // Map user_prompt to userPrompt for frontend
                    moduleId: module.id,
                    moduleTitle: module.module_title,
                    chapterId: chapterData.id,
                    chapterTitle: chapterData.chapter_title
                  });
                }
              }
            }
          }
        } else {
          console.log(`File does not exist: ${filePath}`);
        }
      }
      
      console.log(`Scenario ${situationId} not found in any chapter`);
      res.status(404).json({ error: "Scenario not found" });
    } catch (error) {
      console.error("Error loading scenario:", error);
      res.status(500).json({ error: "Failed to load scenario" });
    }
  });
}