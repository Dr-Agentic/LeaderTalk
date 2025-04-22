import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import session from "express-session";
import MemoryStore from "memorystore";
import { transcribeAndAnalyzeAudio } from "./openai";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { insertUserSchema, updateUserSchema, insertRecordingSchema, leaders } from "@shared/schema";
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
const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    // Extract the correct file extension from the MIME type
    let ext = '';
    if (file.mimetype === 'audio/mp3' || file.mimetype === 'audio/mpeg') {
      ext = '.mp3';
    } else if (file.mimetype === 'audio/wav') {
      ext = '.wav';
    } else if (file.mimetype === 'audio/ogg' || file.mimetype === 'audio/oga') {
      ext = '.ogg';
    } else if (file.mimetype === 'audio/webm') {
      ext = '.webm';
    } else if (file.mimetype === 'audio/m4a') {
      ext = '.m4a';
    } else {
      // Default to mp3 if unknown
      ext = '.mp3';
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: multerStorage,
  // Validate supported audio MIME types for OpenAI
  fileFilter: (_req, file, cb) => {
    const validMimes = [
      'audio/mp3', 'audio/mpeg', 'audio/wav', 
      'audio/webm', 'audio/ogg', 'audio/oga', 
      'audio/m4a', 'audio/flac'
    ];
    
    if (validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.warn(`Rejected file upload with mimetype: ${file.mimetype}`);
      cb(null, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a blacklist for logged-out sessions
  const loggedOutSessionIds = new Set<string>();
  
  // Set up session middleware with enhanced security
  app.use(
    session({
      name: 'leadertalk.sid', // Custom session name for easier identification
      secret: process.env.SESSION_SECRET || "leadertalk-session-secret",
      resave: false,
      saveUninitialized: false,
      rolling: true, // Force cookie to be set on every response
      cookie: {
        httpOnly: true, // Prevent client-side JS from reading cookie
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax', // Provides CSRF protection
        path: '/' // Ensure cookie is sent for all paths
      },
      store: new MemoryStoreFactory({
        checkPeriod: 86400000, // 24 hours
      }),
      genid: function() {
        // Generate a completely random session ID
        return crypto.randomUUID();
      }
    })
  );
  
  // Add additional middleware to check for blacklisted sessions
  app.use((req, res, next) => {
    const sessionId = req.session.id;
    
    // If this is a logged-out session, destroy it and clear cookie
    if (sessionId && loggedOutSessionIds.has(sessionId)) {
      console.log(`Blocked blacklisted session: ${sessionId}`);
      req.session.destroy((err) => {
        if (err) console.error("Error destroying blacklisted session:", err);
        // Use the same cookie settings to ensure it gets cleared
        res.clearCookie('leadertalk.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'lax',
          maxAge: 0
        });
        return res.status(401).json({ message: "Session expired, please log in again" });
      });
      return;
    }
    next();
  });

  // *** User routes ***
  
  // Enhanced logout route with guaranteed session termination
  app.get("/api/auth/logout", (req, res, next) => {
    console.log("Logout request received, preparing to destroy session");
    
    // 1. First ensure we use JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    // 2. Add this session to the blacklist to prevent reuse
    if (req.session && req.session.id) {
      console.log(`Adding session ${req.session.id} to blacklist`);
      loggedOutSessionIds.add(req.session.id);
      
      // Clean up old sessions from blacklist (keep it from growing too large)
      if (loggedOutSessionIds.size > 1000) {
        // If too many sessions, just clear half of them (the oldest ones will be first in iteration)
        const toRemove = Math.floor(loggedOutSessionIds.size / 2);
        let count = 0;
        for (const id of loggedOutSessionIds) {
          if (count >= toRemove) break;
          loggedOutSessionIds.delete(id);
          count++;
        }
      }
    }
    
    // 3. Define cookie settings matching exactly what was used when creating it
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0
    };
    
    // 4. Clear both potential cookie names (we changed from connect.sid to leadertalk.sid)
    res.clearCookie('leadertalk.sid', cookieOptions);
    res.clearCookie('connect.sid', cookieOptions); 
    
    // 5. Empty sensitive data from the session
    if (req.session) {
      // Remove user ID
      req.session.userId = null;
      
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session during logout:", err);
          return res.status(500).json({ message: "Error during logout", success: false });
        }
        
        // Small delay to ensure full session destruction
        setTimeout(() => {
          // Return successful logout
          return res.status(200).json({ 
            message: "Successfully logged out", 
            success: true,
            timestamp: Date.now() // Add timestamp to prevent caching
          });
        }, 100);
      });
    } else {
      // No active session
      return res.status(200).json({ 
        message: "No active session to log out", 
        success: true,
        timestamp: Date.now()
      });
    }
  });
  
  // Special direct login routes for development - NO AUTHENTICATION NEEDED
  app.get("/api/auth/force-login", async (req, res) => {
    try {
      console.log("===== FORCE LOGIN REQUEST =====");
      console.log("Session ID:", req.session.id);
      console.log("Session before login:", req.session);
      console.log("Cookies received:", req.headers.cookie);
      
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
        console.error("Failed to create or find demo user");
        return res.status(500).json({ message: "Failed to create or find demo user" });
      }
      
      // Set the user ID in the session
      console.log("Setting user ID in session:", demoUser.id);
      req.session.userId = demoUser.id;
      
      // Force session save before redirecting
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ message: "Session save error" });
        }
        
        console.log("Session saved successfully");
        console.log("Session after login:", req.session);
        console.log("Redirecting to /");
        console.log("===== END FORCE LOGIN REQUEST =====");
        
        return res.redirect("/");
      });
    } catch (error) {
      console.error("Error in force login:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return res.status(500).json({ message: "Internal server error", details: error.message });
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
  app.get("/api/users/me", async (req, res, next) => {
    // Log session info for debugging
    console.log("===== USER ME REQUEST =====");
    console.log("Session ID:", req.session.id);
    console.log("User ID in session:", req.session.userId || "null");
    console.log("Session cookie:", req.headers.cookie);
    console.log("Full session data:", req.session);
    
    if (!req.session.userId) {
      console.log("No userId in session - unauthorized access");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      console.log("Looking up user ID:", req.session.userId);
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        console.log("User not found in database:", req.session.userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User found:", user.id, user.username);
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = user;
      console.log("===== END USER ME REQUEST =====");
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.log("===== END USER ME REQUEST (ERROR) =====");
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
  
  // Admin route to update the database schema and seed leaders data
  app.post("/api/admin/update-leaders", async (req, res) => {
    try {
      // Only allow in development
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "This endpoint is only available in development mode" });
      }
      
      console.log("Running database migration to update leaders table...");
      
      // Execute raw SQL to add the new columns
      await db.execute(`
        ALTER TABLE leaders 
        ADD COLUMN IF NOT EXISTS controversial BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS generation_most_affected TEXT,
        ADD COLUMN IF NOT EXISTS leadership_styles JSONB,
        ADD COLUMN IF NOT EXISTS famous_phrases JSONB;
      `);
      
      console.log("Migration successful, new columns added to leaders table");
      
      // Return success
      return res.status(200).json({ 
        success: true, 
        message: "Leaders table schema updated successfully"
      });
    } catch (error) {
      console.error("Error updating leaders schema:", error);
      return res.status(500).json({ 
        message: "Failed to update leaders schema", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Admin route to import controversial leaders data from the provided JSON file
  app.post("/api/admin/import-leaders", async (req, res) => {
    try {
      // Only allow in development
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "This endpoint is only available in development mode" });
      }
      
      // Read the JSON file with leader data
      const filePath = path.join(process.cwd(), 'attached_assets', 'controversial_leaders.json');
      console.log(`Reading leaders data from ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          success: false, 
          message: "Leaders data file not found" 
        });
      }
      
      const leadersData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`Found ${leadersData.length} leaders in the file`);
      
      // Get existing leaders from the database
      const existingLeaders = await storage.getLeaders();
      console.log(`Found ${existingLeaders.length} leaders in the database`);
      
      // Create a map of names to DB leaders
      const leaderMap = new Map();
      existingLeaders.forEach(leader => {
        leaderMap.set(leader.name.toLowerCase(), leader);
      });
      
      // Loop through the leaders data and update the database
      const updatedLeaders = [];
      
      for (const leaderData of leadersData) {
        const normalizedName = leaderData.name.toLowerCase();
        const dbLeader = leaderMap.get(normalizedName);
        
        if (dbLeader) {
          // Update the existing leader with the new data
          console.log(`Updating leader: ${leaderData.name}`);
          
          // Use drizzle's API to update the leader
          await db.update(leaders)
            .set({
              controversial: !!leaderData.controversial,
              generationMostAffected: leaderData.generation_most_affected || null,
              leadershipStyles: JSON.stringify(leaderData.leadership_styles || []),
              famousPhrases: JSON.stringify(leaderData.famous_phrases || [])
            })
            .where(eq(leaders.id, dbLeader.id));
          
          updatedLeaders.push({
            id: dbLeader.id,
            name: dbLeader.name,
            updated: true
          });
        } else {
          console.log(`Adding new leader: ${leaderData.name}`);
          
          // Insert new leader
          try {
            const newLeaders = await db.insert(leaders)
              .values([{
                name: leaderData.name,
                title: `${leaderData.name}'s Leadership`,
                description: `${leaderData.name}'s communication style`,
                traits: leaderData.leadership_styles || [],
                biography: `Leader information for ${leaderData.name}`,
                photoUrl: null,
                controversial: !!leaderData.controversial,
                generationMostAffected: leaderData.generation_most_affected || null,
                leadershipStyles: leaderData.leadership_styles || [],
                famousPhrases: leaderData.famous_phrases || []
              }])
              .returning();
            
            if (newLeaders && newLeaders.length > 0) {
              const addedLeader = newLeaders[0];
              updatedLeaders.push({
                id: addedLeader.id,
                name: addedLeader.name,
                added: true
              });
            }
          } catch (insertError) {
            console.error(`Error inserting leader ${leaderData.name}:`, insertError);
          }
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Updated/Added ${updatedLeaders.length} leaders`,
        updatedLeaders 
      });
    } catch (error) {
      console.error("Error importing leaders data:", error);
      return res.status(500).json({ 
        message: "Failed to import leaders data", 
        error: error instanceof Error ? error.message : String(error) 
      });
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
        console.error("No file was uploaded or file was rejected by multer");
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      console.log("Received audio file:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Verify audio file is valid
      if (req.file.size === 0) {
        console.error("Empty audio file received");
        return res.status(400).json({ message: "Empty audio file received" });
      }
      
      // Very small files are likely corrupted or empty
      if (req.file.size < 1000) { // Less than 1KB
        console.warn("Very small audio file received, might be corrupted");
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
      
      // Update recording status and add title/duration if not already set
      await storage.updateRecording(recordingId, { 
        status: "processing",
        title: recording.title || `Recording #${recordingId}`,
        duration: recording.duration || 0
      });
      
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
          console.log("Audio successfully processed:", {
            recordingId,
            transcriptionLength: transcription?.length || 0,
            analysisReceived: !!analysis
          });
          
          // Update the recording with transcription and analysis
          await storage.updateRecordingAnalysis(recordingId, transcription, analysis);
          
          // Delete the temporary file
          fs.unlink(audioPath, (err) => {
            if (err) console.error("Error deleting temporary file:", err);
          });
        })
        .catch((error) => {
          console.error("Error processing recording:", error);
          
          // Update recording with error status
          storage.updateRecording(recordingId, { 
            status: "failed",
            title: recording.title || `Recording #${recordingId}`,
            duration: recording.duration || 0
          });
          
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
