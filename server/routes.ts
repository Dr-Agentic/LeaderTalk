import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { transcribeAndAnalyzeAudio } from "./openai";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { insertUserSchema, updateUserSchema, insertRecordingSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";

const MemoryStoreFactory = MemoryStore(session);

// Auth middleware to verify a user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Set up temp file storage for uploads
const upload = multer({ dest: os.tmpdir() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "leadertalk-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
      store: new MemoryStoreFactory({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // *** User routes ***
  
  // Special direct login routes for development - NO AUTHENTICATION NEEDED
  app.get("/api/auth/force-login", async (req, res) => {
    try {
      // Create demo user if it doesn't exist
      let demoUser = await storage.getUserByEmail("demo@example.com");
      
      if (!demoUser) {
        try {
          console.log("Creating demo user...");
          demoUser = await storage.createUser({
            googleId: "demo-user-" + Date.now(),
            email: "demo@example.com",
            username: "Demo User",
            photoUrl: null,
            dateOfBirth: "1990-01-01",
            profession: "Software Developer",
            goals: "Improve communication skills",
            selectedLeaders: [1, 2, 3] // Default selected leaders
          });
          console.log("Demo user created:", demoUser);
        } catch (createError) {
          console.error("Error creating demo user:", createError);
        }
      } else {
        console.log("Found existing demo user:", demoUser);
        
        // Update the demo user with onboarding info if missing
        if (!demoUser.dateOfBirth || !demoUser.profession || !demoUser.goals || !demoUser.selectedLeaders) {
          try {
            console.log("Updating demo user with onboarding information...");
            demoUser = await storage.updateUser(demoUser.id, {
              dateOfBirth: "1990-01-01",
              profession: "Software Developer",
              goals: "Improve communication skills",
              selectedLeaders: [1, 2, 3]
            });
            console.log("Demo user updated:", demoUser);
          } catch (updateError) {
            console.error("Error updating demo user:", updateError);
          }
        }
      }
      
      if (!demoUser) {
        return res.status(500).json({ message: "Failed to create or find demo user" });
      }
      
      // Set the user ID in the session
      req.session.userId = demoUser.id;
      return res.redirect("/");
    } catch (error) {
      console.error("Error in force login:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Login as a demo user (development only)
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      // Find the demo user by email
      const demoUser = await storage.getUserByEmail("demo@example.com");
      
      if (!demoUser) {
        // Create a demo user if it doesn't exist
        const newUser = await storage.createUser({
          googleId: "demo-user-id",
          email: "demo@example.com",
          username: "Demo User",
          photoUrl: null,
          dateOfBirth: "1990-01-01",
          profession: "Software Developer",
          goals: "Improve communication skills",
          selectedLeaders: [1, 2, 3] // Default selected leaders
        });
        
        // Set the user ID in the session
        req.session.userId = newUser.id;
        return res.status(200).json({ success: true, user: newUser });
      }
      
      // Set the user ID in the session
      req.session.userId = demoUser.id;
      return res.status(200).json({ success: true, user: demoUser });
    } catch (error) {
      console.error("Error in demo login:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get current user
  app.get("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with this Google ID already exists
      const existingUserByGoogleId = await storage.getUserByGoogleId(userData.googleId);
      if (existingUserByGoogleId) {
        req.session.userId = existingUserByGoogleId.id;
        return res.status(200).json(existingUserByGoogleId);
      }
      
      // Check if user with this email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      req.session.userId = newUser.id;
      
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update current user
  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const updateData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.session.userId!, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // *** Leader routes ***
  
  // Get all leaders
  app.get("/api/leaders", async (req, res) => {
    try {
      const leaders = await storage.getLeaders();
      return res.json(leaders);
    } catch (error) {
      console.error("Error fetching leaders:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get leader by ID
  app.get("/api/leaders/:id", async (req, res) => {
    try {
      const leaderId = parseInt(req.params.id);
      if (isNaN(leaderId)) {
        return res.status(400).json({ message: "Invalid leader ID" });
      }
      
      const leader = await storage.getLeader(leaderId);
      if (!leader) {
        return res.status(404).json({ message: "Leader not found" });
      }
      
      return res.json(leader);
    } catch (error) {
      console.error("Error fetching leader:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // *** Recording routes ***
  
  // Get all recordings for current user
  app.get("/api/recordings", requireAuth, async (req, res) => {
    try {
      const recordings = await storage.getRecordings(req.session.userId!);
      return res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get recording by ID
  app.get("/api/recordings/:id", requireAuth, async (req, res) => {
    try {
      const recordingId = parseInt(req.params.id);
      if (isNaN(recordingId)) {
        return res.status(400).json({ message: "Invalid recording ID" });
      }
      
      const recording = await storage.getRecording(recordingId);
      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }
      
      // Verify that the recording belongs to the current user
      if (recording.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to recording" });
      }
      
      return res.json(recording);
    } catch (error) {
      console.error("Error fetching recording:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create new recording
  app.post("/api/recordings", requireAuth, async (req, res) => {
    try {
      const data = insertRecordingSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const recording = await storage.createRecording(data);
      return res.status(201).json(recording);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid recording data", errors: error.errors });
      }
      
      console.error("Error creating recording:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Upload and analyze recording
  app.post("/api/recordings/upload", requireAuth, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      const recordingId = parseInt(req.body.recordingId);
      if (isNaN(recordingId)) {
        return res.status(400).json({ message: "Invalid recording ID" });
      }
      
      const recording = await storage.getRecording(recordingId);
      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }
      
      // Verify that the recording belongs to the current user
      if (recording.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to recording" });
      }
      
      // Update recording status
      await storage.updateRecording(recordingId, { status: "processing" });
      
      // Get selected leaders for this user
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.selectedLeaders) {
        return res.status(400).json({ message: "User has no selected leaders" });
      }
      
      const leaders = [];
      for (const leaderId of user.selectedLeaders) {
        const leader = await storage.getLeader(leaderId);
        if (leader) {
          leaders.push(leader);
        }
      }
      
      // Process the recording in the background
      const audioPath = req.file.path;
      
      // Start the transcription and analysis process
      transcribeAndAnalyzeAudio(audioPath, recording, leaders)
        .then(async ({ transcription, analysis }) => {
          // Update the recording with transcription and analysis
          await storage.updateRecordingAnalysis(recordingId, transcription, analysis);
          
          // Delete the temporary file
          fs.unlink(audioPath, (err) => {
            if (err) console.error("Error deleting temporary file:", err);
          });
        })
        .catch((error) => {
          console.error("Error processing recording:", error);
          storage.updateRecording(recordingId, { status: "failed" });
          
          // Delete the temporary file
          fs.unlink(audioPath, (err) => {
            if (err) console.error("Error deleting temporary file:", err);
          });
        });
      
      return res.status(202).json({ message: "Processing started" });
    } catch (error) {
      console.error("Error uploading recording:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
