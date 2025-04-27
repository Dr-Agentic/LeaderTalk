import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import session from "express-session";
import MemoryStore from "memorystore";
import { transcribeAndAnalyzeAudio, generateLeaderAlternative } from "./openai";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { eq, desc, inArray } from "drizzle-orm";
import { fileURLToPath } from "url";
import cors from "cors";

// Get the directory path for our project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  insertUserSchema, updateUserSchema, insertRecordingSchema, 
  leaders, chapters, modules, situations, userProgress, situationAttempts,
  recordings, users, userWordUsage,
  insertChapterSchema, insertModuleSchema, insertSituationSchema,
  insertUserProgressSchema, updateUserProgressSchema,
  insertSituationAttemptSchema, AttemptEvaluation
} from "@shared/schema";
import { importLeadersFromFile } from "./import-leaders";
import { updateLeaderImages } from "./update-leader-images";
import { importTrainingData } from "./import-training-data";
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
    } else if (file.mimetype === 'audio/mp4') {
      ext = '.mp4';
    } else if (file.mimetype === 'audio/aac') {
      ext = '.aac';
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
      'audio/m4a', 'audio/flac', 'audio/mp4',
      'audio/aac', 'audio/x-m4a', 'audio/x-aac'
    ];
    
    // Log all audio file uploads with type
    console.log(`Received audio upload with mimetype: ${file.mimetype}`);
    
    if (validMimes.includes(file.mimetype)) {
      console.log(`Accepted audio file with mimetype: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.warn(`Rejected file upload with mimetype: ${file.mimetype}`);
      cb(null, false);
    }
  }
});

// Serve static files from public directory
export function servePublicFiles(app: Express) {
  const publicPath = path.join(process.cwd(), 'public');
  console.log('Setting up static file serving from:', publicPath);
  app.use(express.static(publicPath));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup CORS to allow requests from the deployed domain
  const corsOptions = {
    origin: [
      // Local development URLs
      'http://localhost:5000', 
      'http://localhost:3000',
      // Deployed domain
      'https://app.leadertalkcoach.com',
      // Allow Replit domains
      /\.replit\.app$/,
      /\.repl\.co$/
    ],
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  app.use(cors(corsOptions));
  
  // Setup static file serving
  servePublicFiles(app);
  // Route to import leaders
  app.post("/api/admin/import-leaders", async (req, res) => {
    try {
      const importResult = await importLeadersFromFile();
      return res.json(importResult);
    } catch (error) {
      console.error("Error importing leaders:", error);
      return res.status(500).json({ success: false, message: "Error importing leaders" });
    }
  });
  
  // Route to update leader images to clean versions
  app.post("/api/admin/update-leader-images", async (req, res) => {
    try {
      const updateResult = await updateLeaderImages();
      return res.json(updateResult);
    } catch (error) {
      console.error("Error updating leader images:", error);
      return res.status(500).json({ success: false, message: "Error updating leader images" });
    }
  });
  
  // Route to import training data
  app.post("/api/admin/import-training-data", async (req, res) => {
    try {
      await importTrainingData();
      return res.json({ success: true, message: "Training data imported successfully" });
    } catch (error) {
      console.error("Error importing training data:", error);
      return res.status(500).json({ success: false, message: "Error importing training data" });
    }
  });
  
  // Create a blacklist for logged-out sessions
  const loggedOutSessionIds = new Set<string>();
  
  // Set up session middleware with enhanced security
  app.use(
    session({
      name: 'leadertalk.sid', // Custom session name for easier identification
      secret: process.env.SESSION_SECRET || "leadertalk-session-secret",
      resave: false,
      saveUninitialized: true, // Changed to true to ensure cookie is set immediately
      rolling: true, // Force cookie to be set on every response
      cookie: {
        httpOnly: true, // Prevent client-side JS from reading cookie
        // In production with HTTPS, set secure to true
        // In development or when using HTTP, set to false
        secure: process.env.NODE_ENV === "production" && 
                process.env.SECURE_COOKIES !== "false",
                
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        
        // For cross-origin requests in production, use 'none'
        // In development, use 'lax' for better security
        sameSite: process.env.NODE_ENV === "production" ? 
                 (process.env.SAMESITE_COOKIES || 'none') : 'lax',
                 
        path: '/', // Ensure cookie is sent for all paths
        
        // Domain config for production environments
        domain: process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN ? 
          process.env.COOKIE_DOMAIN : undefined
      },
      store: new MemoryStoreFactory({
        checkPeriod: 86400000, // 24 hours
      }),
      genid: function() {
        // Generate a completely random session ID
        return crypto.randomUUID();
      },
      proxy: process.env.NODE_ENV === "production" // Trust the proxy in production
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
          secure: process.env.NODE_ENV === "production" && 
                  process.env.SECURE_COOKIES !== "false",
          sameSite: process.env.NODE_ENV === 'production' ? 
                   (process.env.SAMESITE_COOKIES || 'none') as const : 'lax' as const,
          maxAge: 0,
          domain: process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN ? 
            process.env.COOKIE_DOMAIN : undefined
        });
        return res.status(401).json({ message: "Session expired, please log in again" });
      });
      return;
    }
    next();
  });

  // *** User routes ***
  
  // Debug endpoint to check session status
  app.get("/api/debug/session", (req, res) => {
    const sessionId = req.session?.id || "";
    const userId = req.session?.userId || null;
    const isLoggedIn = !!req.session?.userId;
    const sessionExists = !!req.session?.id;
    
    // Enhanced session debug info (without exposing sensitive data)
    const debug = {
      sessionExists,
      sessionId: sessionId ? sessionId.substring(0, 7) + "…" : null,
      userId,
      isLoggedIn,
      cookiePresent: !!req.headers.cookie?.includes('leadertalk.sid'),
      sessionAge: req.session?.cookie?.maxAge || null,
      cookieExists: !!req.headers.cookie,
      cookieHeader: req.headers.cookie ? 
        req.headers.cookie.substring(0, 20) + "…" : null // Only show part of cookie header
    };
    
    // Log on server side for debugging
    console.log("Session check:", {
      ...debug,
      fullSessionId: req.session?.id,
      sessionData: req.session
    });
    
    return res.json(debug);
  });
  
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
      secure: process.env.NODE_ENV === "production" && 
              process.env.SECURE_COOKIES !== "false",
      sameSite: process.env.NODE_ENV === 'production' ? 
               (process.env.SAMESITE_COOKIES || 'none') as const : 'lax' as const,
      maxAge: 0,
      domain: process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN ? 
        process.env.COOKIE_DOMAIN : undefined
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
          // Get current date for registration date and billing cycle day
          const now = new Date();
          const registrationDay = now.getUTCDate();
          
          demoUser = await storage.createUser({
            googleId: "demo-user-" + Date.now(),
            email: "demo@example.com",
            username: "Demo User",
            photoUrl: null,
            dateOfBirth: "1990-01-01",
            profession: "Software Developer",
            goals: "Improve communication skills",
            selectedLeaders: [1, 2, 3], // Default selected leaders
            billingCycleDay: registrationDay, // Set billing cycle to today's date
            subscriptionPlan: "free"
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
        // Get current date for registration date and billing cycle day
        const now = new Date();
        const registrationDay = now.getUTCDate();
        
        const newUser = await storage.createUser({
          googleId: "demo-user-id",
          email: "demo@example.com",
          username: "Demo User",
          photoUrl: null,
          dateOfBirth: "1990-01-01",
          profession: "Software Developer",
          goals: "Improve communication skills",
          selectedLeaders: [1, 2, 3], // Default selected leaders
          billingCycleDay: registrationDay,
          subscriptionPlan: "free"
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
  
  // Delete all records for the current user (for testing purposes)
  app.post("/api/users/delete-records", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      console.log(`Requested deletion of records for user ID: ${userId}`);
      
      // Delete recordings
      console.log('- Deleting recordings...');
      const deletedRecordings = await db.delete(recordings)
        .where(eq(recordings.userId, userId))
        .returning({ id: recordings.id });
      console.log(`  Deleted ${deletedRecordings.length} recordings.`);
      
      // Delete progress records
      console.log('- Deleting progress records...');
      const deletedProgress = await db.delete(userProgress)
        .where(eq(userProgress.userId, userId))
        .returning({ id: userProgress.id });
      console.log(`  Deleted ${deletedProgress.length} progress records.`);
      
      // Delete situation attempts
      console.log('- Deleting situation attempts...');
      const deletedAttempts = await db.delete(situationAttempts)
        .where(eq(situationAttempts.userId, userId))
        .returning({ id: situationAttempts.id });
      console.log(`  Deleted ${deletedAttempts.length} situation attempts.`);
      
      // Delete word usage records
      console.log('- Deleting word usage records...');
      const deletedWordUsage = await db.delete(userWordUsage)
        .where(eq(userWordUsage.userId, userId))
        .returning({ id: userWordUsage.id });
      console.log(`  Deleted ${deletedWordUsage.length} word usage records.`);
      
      // Reset user onboarding fields
      console.log('- Resetting user onboarding data...');
      await db.update(users)
        .set({
          dateOfBirth: null,
          profession: null,
          goals: null,
          selectedLeaders: null
        })
        .where(eq(users.id, userId));
      
      console.log(`Cleanup complete for user ID: ${userId}`);
      
      return res.json({ 
        success: true, 
        message: "All user records have been deleted", 
        counts: {
          recordings: deletedRecordings.length,
          progressRecords: deletedProgress.length,
          situationAttempts: deletedAttempts.length,
          wordUsageRecords: deletedWordUsage.length
        }
      });
    } catch (error) {
      console.error("Error deleting user records:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to delete user records" 
      });
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
      
      // Set up billing cycle day to today's date for anniversary-based billing
      const now = new Date();
      const registrationDay = now.getUTCDate();
      
      // Add billing cycle information to user data
      const enhancedUserData = {
        ...userData,
        billingCycleDay: registrationDay,
        subscriptionPlan: "free"
      };
      
      const newUser = await storage.createUser(enhancedUserData);
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
      // Get all leaders
      const leaders = await storage.getLeaders();
      
      // Process the leaders data to ensure proper JSON formatting
      const enhancedLeaders = leaders.map(leader => {
        // Parse JSON string fields if needed
        let traits = leader.traits;
        let leadershipStyles = leader.leadershipStyles;
        let famousPhrases = leader.famousPhrases;
        
        // Parse traits if it's a string
        if (typeof traits === 'string') {
          try { traits = JSON.parse(traits); } 
          catch (e) { traits = []; }
        }
        
        // Parse leadership styles if it's a string
        if (typeof leadershipStyles === 'string') {
          try { leadershipStyles = JSON.parse(leadershipStyles); } 
          catch (e) { leadershipStyles = []; }
        }
        
        // Parse famous phrases if it's a string
        if (typeof famousPhrases === 'string') {
          try { famousPhrases = JSON.parse(famousPhrases); } 
          catch (e) { famousPhrases = []; }
        }
        
        // Generate photoUrl based on leader name
        const photoName = leader.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const photoUrl = `/images/leaders/${photoName}.svg`;
        
        // Return enhanced leader object
        return {
          ...leader,
          traits: traits || [],
          leadershipStyles: leadershipStyles || [],
          famousPhrases: famousPhrases || [],
          controversial: !!leader.controversial, // Ensure it's a boolean
          photoUrl: photoUrl // Add the photo URL
        };
      });
      
      console.log(`Returning ${enhancedLeaders.length} leaders, with ${enhancedLeaders.filter(l => !l.controversial).length} non-controversial`);
      return res.json(enhancedLeaders);
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
      const filePath = path.join(process.cwd(), 'attached_assets', 'leaders_data.json');
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
      // Check if we have a file at all
      if (!req.file) {
        console.error("No file was uploaded or file was rejected by multer");
        
        // More detailed error based on what might have happened
        if (req.headers['content-type']?.includes('multipart/form-data')) {
          // The right content-type was sent, but maybe the file was rejected by multer
          return res.status(400).json({ 
            message: "No audio file provided or file format not supported", 
            supportedFormats: [
              'audio/mp3', 'audio/mpeg', 'audio/wav',
              'audio/webm', 'audio/ogg', 'audio/oga',
              'audio/m4a', 'audio/flac', 'audio/mp4',
              'audio/aac', 'audio/x-m4a', 'audio/x-aac'
            ]
          });
        } else {
          // Content-type might be wrong
          return res.status(400).json({ 
            message: "Incorrect request format. Audio must be sent as multipart/form-data with 'audio' field name." 
          });
        }
      }
      
      console.log("Received audio file:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        originalname: req.file.originalname || "unknown"
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
  
  // *** Training Module Routes ***
  
  // Get all chapters - from database
  app.get("/api/training/chapters", requireAuth, async (req, res) => {
    try {
      const allChapters = await db.select()
        .from(chapters)
        .orderBy(chapters.order);
      
      return res.json(allChapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      return res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });
  
  // Get chapter JSON files directly - bypasses the database
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
      
      return res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapter files:", error);
      return res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });
  
  // Get a specific chapter with its modules - from database
  app.get("/api/training/chapters/:chapterId", requireAuth, async (req, res) => {
    try {
      const chapterId = Number(req.params.chapterId);
      
      if (isNaN(chapterId)) {
        return res.status(400).json({ message: "Invalid chapter ID" });
      }
      
      const [chapter] = await db.select()
        .from(chapters)
        .where(eq(chapters.id, chapterId));
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      
      const modulesList = await db.select()
        .from(modules)
        .where(eq(modules.chapterId, chapterId))
        .orderBy(modules.order);
      
      return res.json({
        ...chapter,
        modules: modulesList
      });
    } catch (error) {
      console.error("Error fetching chapter:", error);
      return res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });
  
  // Get a specific chapter directly from the JSON file - bypasses the database
  app.get("/api/training/chapters-direct/:chapterId", requireAuth, async (req, res) => {
    try {
      const chapterId = Number(req.params.chapterId);
      
      if (isNaN(chapterId)) {
        return res.status(400).json({ message: "Invalid chapter ID" });
      }
      
      // Find the corresponding chapter file
      const chapterFile = `chapter${chapterId}_expanded.json`;
      const projectRoot = process.cwd();
      const filePath = path.join(projectRoot, 'attached_assets', chapterFile);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Chapter file not found" });
      }
      
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const chapterData = JSON.parse(rawData);
      
      // Get the user's progress for situations in this chapter
      const moduleSituationIds = chapterData.modules.flatMap(module => 
        module.scenarios.map(scenario => scenario.id)
      );
      
      const userProgressRecords = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, req.session.userId))
        .where(inArray(userProgress.situationId, moduleSituationIds));
      
      // Add user progress to each scenario
      for (const module of chapterData.modules) {
        for (const scenario of module.scenarios) {
          const progress = userProgressRecords.find(r => r.situationId === scenario.id);
          scenario.userProgress = progress || null;
        }
      }
      
      return res.json(chapterData);
    } catch (error) {
      console.error("Error fetching chapter file:", error);
      return res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });
  
  // Get a specific module with its situations - from database
  app.get("/api/training/modules/:moduleId", requireAuth, async (req, res) => {
    try {
      const moduleId = Number(req.params.moduleId);
      
      if (isNaN(moduleId)) {
        return res.status(400).json({ message: "Invalid module ID" });
      }
      
      const [module] = await db.select()
        .from(modules)
        .where(eq(modules.id, moduleId));
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const situationsList = await db.select()
        .from(situations)
        .where(eq(situations.moduleId, moduleId))
        .orderBy(situations.order);
      
      return res.json({
        ...module,
        situations: situationsList
      });
    } catch (error) {
      console.error("Error fetching module:", error);
      return res.status(500).json({ message: "Failed to fetch module" });
    }
  });
  
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
      
      // Find the module in the chapters
      const projectRoot = process.cwd();
      for (const chapterFile of chapterFiles) {
        const filePath = path.join(projectRoot, 'attached_assets', chapterFile);
        
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const chapterData = JSON.parse(rawData);
          
          // Find the module in this chapter
          const module = chapterData.modules.find(m => m.id === moduleId);
          
          if (module) {
            foundModule = module;
            chapterId = chapterData.id;
            break;
          }
        }
      }
      
      if (!foundModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Get the user's progress for situations in this module
      const situationIds = foundModule.scenarios.map(s => s.id);
      
      const userProgressRecords = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, req.session.userId))
        .where(inArray(userProgress.situationId, situationIds));
      
      // Add user progress to each scenario
      for (const scenario of foundModule.scenarios) {
        const progress = userProgressRecords.find(r => r.situationId === scenario.id);
        scenario.userProgress = progress || null;
      }
      
      return res.json({
        ...foundModule,
        chapterId,
        // Rename scenarios to situations to match database terminology
        situations: foundModule.scenarios,
        scenarios: undefined
      });
    } catch (error) {
      console.error("Error fetching module from JSON:", error);
      return res.status(500).json({ message: "Failed to fetch module" });
    }
  });
  
  // Get a specific situation - from database
  app.get("/api/training/situations/:situationId", requireAuth, async (req, res) => {
    try {
      const situationId = Number(req.params.situationId);
      
      if (isNaN(situationId)) {
        return res.status(400).json({ message: "Invalid situation ID" });
      }
      
      const [situation] = await db.select()
        .from(situations)
        .where(eq(situations.id, situationId));
      
      if (!situation) {
        return res.status(404).json({ message: "Situation not found" });
      }
      
      // Check if the user has already completed this situation
      const [userProgressRecord] = await db.select()
        .from(userProgress)
        .where(eq(userProgress.situationId, situationId))
        .where(eq(userProgress.userId, req.session.userId));
      
      return res.json({
        ...situation,
        userProgress: userProgressRecord || null
      });
    } catch (error) {
      console.error("Error fetching situation:", error);
      return res.status(500).json({ message: "Failed to fetch situation" });
    }
  });
  
  // Get a specific situation directly from JSON files - bypasses the database
  app.get("/api/training/situations-direct/:situationId", requireAuth, async (req, res) => {
    try {
      const situationId = Number(req.params.situationId);
      
      if (isNaN(situationId)) {
        return res.status(400).json({ message: "Invalid situation ID" });
      }
      
      // Search all chapter files for the requested situation
      const chapterFiles = [
        'chapter1_expanded.json',
        'chapter2_expanded.json',
        'chapter3_expanded.json',
        'chapter4_expanded.json',
        'chapter5_expanded.json'
      ];
      
      let foundSituation = null;
      let foundModule = null;
      let chapterId = null;
      
      // Search through all chapters and modules to find the situation
      const projectRoot = process.cwd();
      for (const chapterFile of chapterFiles) {
        const filePath = path.join(projectRoot, 'attached_assets', chapterFile);
        
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const chapterData = JSON.parse(rawData);
          
          // Loop through modules in this chapter
          for (const module of chapterData.modules) {
            // Check if this is for a module with ID that matches situationId
            if (module.id === situationId) {
              console.log(`Found module with ID ${situationId} instead of situation`);
              // This is a module with the same ID as the requested situation
              // Return a redirect to the module view
              return res.status(302).json({ 
                redirect: true, 
                redirectUrl: `/training/module/${situationId}`,
                message: `ID ${situationId} is a module, not a situation` 
              });
            }
            
            // Look for the situation in this module
            const situation = module.scenarios.find(s => s.id === situationId);
            if (situation) {
              foundSituation = situation;
              foundModule = module;
              chapterId = chapterData.id;
              break;
            }
          }
          
          if (foundSituation) break;
        }
      }
      
      if (!foundSituation) {
        return res.status(404).json({ message: "Situation not found" });
      }
      
      // Check if the user has already completed this situation
      const [userProgressRecord] = await db.select()
        .from(userProgress)
        .where(eq(userProgress.situationId, situationId))
        .where(eq(userProgress.userId, req.session.userId));
      
      // Get attempt history only if the table exists (add for backward compatibility)
      let attempts = [];
      try {
        attempts = await db.select()
          .from(situationAttempts)
          .where(eq(situationAttempts.situationId, situationId))
          .where(eq(situationAttempts.userId, req.session.userId))
          .orderBy(desc(situationAttempts.createdAt));
      } catch (err) {
        console.log('Situation attempts table not found, skipping attempts fetch');
      }
      
      // IMPORTANT: ONLY get user progress for THIS specific situation ID
      // Don't include any user progress unless it's specifically for this situation
      let userProgressForThisSituation = null;
      if (userProgressRecord && userProgressRecord.situationId === situationId) {
        userProgressForThisSituation = userProgressRecord;
      }
      
      return res.json({
        // Map the situation structure to match what the frontend expects
        id: foundSituation.id,
        moduleId: foundModule.id,
        description: foundSituation.description,
        userPrompt: foundSituation.user_prompt,
        styleResponses: foundSituation.style_responses,
        order: foundSituation.order || 1,
        context: foundSituation.context || null,
        // Only include user progress if it matches this situation ID
        userProgress: userProgressForThisSituation, 
        // Add module and chapter context
        module: {
          id: foundModule.id,
          title: foundModule.module_title,
          leadershipTrait: foundModule.leadership_trait,
          situationType: foundModule.situation_type
        },
        chapter: {
          id: chapterId,
          title: `Chapter ${chapterId}`
        },
        attempts: attempts || []
      });
    } catch (error) {
      console.error("Error fetching situation from JSON:", error);
      return res.status(500).json({ message: "Failed to fetch situation" });
    }
  });
  
  // Submit a response to a situation
  app.post("/api/training/situations/:situationId/respond", requireAuth, async (req, res) => {
    try {
      const situationId = Number(req.params.situationId);
      const { response, leadershipStyle, fromJsonFile = false } = req.body;
      
      if (isNaN(situationId)) {
        return res.status(400).json({ message: "Invalid situation ID" });
      }
      
      if (!response) {
        return res.status(400).json({ message: "Response is required" });
      }
      
      // Get style responses either from database or from JSON files
      let styleResponses;
      
      if (fromJsonFile) {
        // Search all chapter files for the requested situation
        const chapterFiles = [
          'chapter1_expanded.json',
          'chapter2_expanded.json',
          'chapter3_expanded.json',
          'chapter4_expanded.json',
          'chapter5_expanded.json'
        ];
        
        let foundSituation = null;
        
        // Find the situation in the JSON files
        const projectRoot = process.cwd();
        for (const chapterFile of chapterFiles) {
          const filePath = path.join(projectRoot, 'attached_assets', chapterFile);
          
          if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const chapterData = JSON.parse(rawData);
            
            // Loop through modules in this chapter
            for (const module of chapterData.modules) {
              // Look for the situation in this module
              const situation = module.scenarios.find(s => s.id === situationId);
              if (situation) {
                foundSituation = situation;
                break;
              }
            }
            
            if (foundSituation) break;
          }
        }
        
        if (!foundSituation) {
          return res.status(404).json({ message: "Situation not found in JSON files" });
        }
        
        styleResponses = foundSituation.style_responses;
      } else {
        // Get from database
        const [situation] = await db.select()
          .from(situations)
          .where(eq(situations.id, situationId));
        
        if (!situation) {
          return res.status(404).json({ message: "Situation not found in database" });
        }
        
        styleResponses = situation.styleResponses;
      }
      
      // Calculate a score based on the response and the leadership style
      // This would typically use AI to evaluate the response
      // For now, we'll use a simple scoring method
      let score = 0;
      let feedback = "";
      let passed = false;
      
      if (leadershipStyle && styleResponses[leadershipStyle]) {
        // Simple scoring based on word overlap
        const styleWords = styleResponses[leadershipStyle].toLowerCase().split(/\W+/);
        const responseWords = response.toLowerCase().split(/\W+/);
        
        const commonWords = styleWords.filter(word => 
          word.length > 3 && responseWords.includes(word)
        ).length;
        
        score = Math.min(100, Math.floor((commonWords / styleWords.length) * 100));
        passed = score >= 70;
        
        if (passed) {
          feedback = "Great job! Your response demonstrates a good understanding of the " + 
            leadershipStyle + " leadership style in this situation.";
        } else {
          feedback = "Your response could better reflect the " + leadershipStyle + 
            " leadership style. Consider focusing more on " + 
            (leadershipStyle === "empathetic" ? "understanding emotions and building trust." : 
             leadershipStyle === "inspirational" ? "motivation and the bigger picture." : 
             "clarity and direct action.");
        }
      } else {
        // No leadership style specified or invalid style
        feedback = "Please select a valid leadership style for better feedback.";
        score = 50; // Default middle score
      }
      
      // Check if user has already responded to this situation
      const [existingProgress] = await db.select()
        .from(userProgress)
        .where(eq(userProgress.situationId, situationId))
        .where(eq(userProgress.userId, req.session.userId));
      
      let userProgressRecord;
      
      if (existingProgress) {
        // Update existing progress
        [userProgressRecord] = await db.update(userProgress)
          .set({
            response,
            score,
            feedback,
            passed,
            completedAt: new Date()
          })
          .where(eq(userProgress.id, existingProgress.id))
          .returning();
      } else {
        // Create new progress record
        [userProgressRecord] = await db.insert(userProgress)
          .values({
            userId: req.session.userId,
            situationId,
            response,
            score,
            feedback,
            passed,
            completedAt: new Date()
          })
          .returning();
      }
      
      // Create an evaluation for the attempt
      const evaluation: AttemptEvaluation = {
        styleMatchScore: score,
        clarity: Math.floor(Math.random() * 40) + 60, // Random score between 60-100 for demonstration
        empathy: leadershipStyle === "empathetic" ? score : Math.floor(Math.random() * 50) + 50,
        persuasiveness: leadershipStyle === "inspirational" ? score : Math.floor(Math.random() * 50) + 50,
        strengths: [],
        weaknesses: [],
        improvement: feedback
      };
      
      // Add some strengths and weaknesses based on the score
      if (score > 70) {
        evaluation.strengths.push("Good understanding of the chosen leadership style");
        evaluation.strengths.push("Clear communication of key points");
      } else {
        evaluation.weaknesses.push("Limited alignment with chosen leadership style");
        evaluation.weaknesses.push("Missing key elements of effective communication");
      }
      
      if (leadershipStyle === "empathetic" && score > 60) {
        evaluation.strengths.push("Shows good empathy and emotional intelligence");
      } else if (leadershipStyle === "inspirational" && score > 60) {
        evaluation.strengths.push("Effectively motivates and inspires action");
      } else if (leadershipStyle === "commanding" && score > 60) {
        evaluation.strengths.push("Provides clear direction and structure");
      }
      
      // Create a record of this attempt only if the table exists
      try {
        await db.insert(situationAttempts)
          .values({
            userId: req.session.userId,
            situationId,
            response,
            leadershipStyle,
            score,
            feedback,
            evaluation
          });
        console.log("Attempt record created successfully");
      } catch (error) {
        console.log("Could not create attempt record. Table may not exist:", error);
        // Continue without throwing - the basic user progress is still saved
      }
      
      return res.json({
        success: true,
        progress: userProgressRecord
      });
    } catch (error) {
      console.error("Error processing situation response:", error);
      return res.status(500).json({ message: "Failed to process response" });
    }
  });
  
  // Get user progress summary
  app.get("/api/training/progress", requireAuth, async (req, res) => {
    try {
      // Get all user progress records
      const userProgressRecords = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, req.session.userId));
      
      // Get all chapters
      const allChapters = await db.select().from(chapters).orderBy(chapters.order);
      
      // Get all modules
      const allModules = await db.select().from(modules).orderBy(modules.order);
      
      // Get all situations
      const allSituations = await db.select().from(situations).orderBy(situations.order);
      
      // Calculate progress statistics
      const totalSituations = allSituations.length;
      const completedSituations = userProgressRecords.length;
      const passedSituations = userProgressRecords.filter(r => r.passed).length;
      
      // Calculate average score
      const averageScore = completedSituations > 0
        ? userProgressRecords.reduce((sum, record) => sum + (record.score || 0), 0) / completedSituations
        : 0;
      
      // Map progress by chapter and module
      const progressByChapter = allChapters.map(chapter => {
        const chapterModules = allModules.filter(m => m.chapterId === chapter.id);
        
        const modulesProgress = chapterModules.map(module => {
          const moduleSituations = allSituations.filter(s => s.moduleId === module.id);
          const moduleProgressRecords = userProgressRecords.filter(r => 
            moduleSituations.some(s => s.id === r.situationId)
          );
          
          const totalModuleSituations = moduleSituations.length;
          const completedModuleSituations = moduleProgressRecords.length;
          
          return {
            id: module.id,
            title: module.title,
            order: module.order,
            totalSituations: totalModuleSituations,
            completedSituations: completedModuleSituations,
            progress: totalModuleSituations > 0 
              ? Math.floor((completedModuleSituations / totalModuleSituations) * 100) 
              : 0
          };
        });
        
        const totalChapterSituations = modulesProgress.reduce(
          (sum, module) => sum + module.totalSituations, 0
        );
        const completedChapterSituations = modulesProgress.reduce(
          (sum, module) => sum + module.completedSituations, 0
        );
        
        return {
          id: chapter.id,
          title: chapter.title,
          order: chapter.order,
          modules: modulesProgress,
          totalSituations: totalChapterSituations,
          completedSituations: completedChapterSituations,
          progress: totalChapterSituations > 0 
            ? Math.floor((completedChapterSituations / totalChapterSituations) * 100) 
            : 0
        };
      });
      
      return res.json({
        totalSituations,
        completedSituations,
        passedSituations,
        averageScore,
        progress: totalSituations > 0 ? Math.floor((completedSituations / totalSituations) * 100) : 0,
        chapters: progressByChapter
      });
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return res.status(500).json({ message: "Failed to fetch progress" });
    }
  });
  
  // Get the next incomplete situation for the user
  app.get("/api/training/next-situation", requireAuth, async (req, res) => {
    try {
      // Get all user progress records
      const userProgressRecords = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, req.session.userId));
      
      // Get all completed situation IDs
      const completedSituationIds = userProgressRecords.map(r => r.situationId);
      
      // Get the first situation that hasn't been completed
      const allSituations = await db.select()
        .from(situations)
        .orderBy(situations.moduleId)
        .orderBy(situations.order);
      
      const nextSituation = allSituations.find(s => !completedSituationIds.includes(s.id));
      
      if (!nextSituation) {
        return res.json({ 
          completed: true,
          message: "All situations completed",
          nextSituation: null
        });
      }
      
      // Get the module for context
      const [module] = await db.select()
        .from(modules)
        .where(eq(modules.id, nextSituation.moduleId));
      
      // Get the chapter for context
      const [chapter] = await db.select()
        .from(chapters)
        .where(eq(chapters.id, module.chapterId));
      
      return res.json({
        completed: false,
        nextSituation: {
          ...nextSituation,
          module: {
            id: module.id,
            title: module.title
          },
          chapter: {
            id: chapter.id,
            title: chapter.title
          }
        }
      });
    } catch (error) {
      console.error("Error finding next situation:", error);
      return res.status(500).json({ message: "Failed to find next situation" });
    }
  });
  
  // Get the next incomplete situation for the user - directly from JSON files
  app.get("/api/training/next-situation-direct", requireAuth, async (req, res) => {
    try {
      // Get all user progress records
      const userProgressRecords = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, req.session.userId));
      
      // Get all completed situation IDs
      const completedSituationIds = userProgressRecords.map(r => r.situationId);
      
      // Read all chapter files to build a complete list of situations
      const chapterFiles = [
        'chapter1_expanded.json',
        'chapter2_expanded.json',
        'chapter3_expanded.json',
        'chapter4_expanded.json',
        'chapter5_expanded.json'
      ];
      
      let allSituations = [];
      let chapterMap = {};
      let moduleMap = {};
      
      // Build complete catalog of situations from the files
      for (const chapterFile of chapterFiles) {
        const filePath = path.join(__dirname, '..', 'attached_assets', chapterFile);
        
        if (fs.existsSync(filePath)) {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const chapterData = JSON.parse(rawData);
          
          // Store chapter info
          chapterMap[chapterData.id] = {
            id: chapterData.id,
            title: chapterData.chapter_title
          };
          
          // Loop through modules
          for (const module of chapterData.modules) {
            // Store module info
            moduleMap[module.id] = {
              id: module.id,
              title: module.module_title,
              chapterId: chapterData.id
            };
            
            // Add situations from this module
            for (const scenario of module.scenarios) {
              allSituations.push({
                id: scenario.id,
                moduleId: module.id,
                description: scenario.description,
                userPrompt: scenario.user_prompt,
                styleResponses: scenario.style_responses,
                order: scenario.order || scenario.id % 100, // Use ID mod 100 as fallback order
                context: scenario.context || null
              });
            }
          }
        }
      }
      
      // Sort situations by module ID and order
      allSituations.sort((a, b) => {
        if (a.moduleId === b.moduleId) {
          return a.order - b.order;
        }
        return a.moduleId - b.moduleId;
      });
      
      // Find the first incomplete situation
      const nextSituation = allSituations.find(s => !completedSituationIds.includes(s.id));
      
      if (!nextSituation) {
        return res.json({ 
          completed: true,
          message: "All situations completed",
          nextSituation: null
        });
      }
      
      // Get the module for context
      const module = moduleMap[nextSituation.moduleId];
      
      // Get the chapter for context
      const chapter = chapterMap[module.chapterId];
      
      return res.json({
        completed: false,
        nextSituation: {
          ...nextSituation,
          module: {
            id: module.id,
            title: module.title
          },
          chapter: {
            id: chapter.id,
            title: chapter.title
          }
        }
      });
    } catch (error) {
      console.error("Error fetching next situation from JSON:", error);
      return res.status(500).json({ message: "Failed to fetch next situation" });
    }
  });
  
  // Get situation attempts for a specific situation
  app.get("/api/training/situations/:situationId/attempts", requireAuth, async (req, res) => {
    try {
      const situationId = Number(req.params.situationId);
      
      if (isNaN(situationId)) {
        return res.status(400).json({ message: "Invalid situation ID" });
      }
      
      // Get all attempts for this situation by the current user, if the table exists
      let attempts = [];
      try {
        attempts = await db.select()
          .from(situationAttempts)
          .where(eq(situationAttempts.situationId, situationId))
          .where(eq(situationAttempts.userId, req.session.userId))
          .orderBy(desc(situationAttempts.createdAt));
      } catch (err) {
        console.log("Could not retrieve situation attempts. Table may not exist:", err);
        // Return empty array for attempts
      }
      
      return res.json({
        attempts
      });
    } catch (error) {
      console.error("Error retrieving situation attempts:", error);
      return res.status(500).json({ message: "Failed to retrieve attempts" });
    }
  });

  // Endpoint to get a leader's alternative text for a negative communication moment
  app.post("/api/leader-alternative", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        leaderId: z.number(),
        originalText: z.string().min(1).max(1000)
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request body", 
          errors: validation.error.flatten().fieldErrors 
        });
      }
      
      const { leaderId, originalText } = validation.data;
      
      // Check if the leader exists
      const leader = await storage.getLeader(leaderId);
      if (!leader) {
        return res.status(404).json({ message: "Leader not found" });
      }
      
      // First check if we already have a cached alternative for this leader and text
      let alternative = await storage.getLeaderAlternative(leaderId, originalText);
      
      // If not found, generate a new one
      if (!alternative) {
        try {
          const alternativeText = await generateLeaderAlternative(leaderId, originalText, leader);
          alternative = await storage.createLeaderAlternative({
            leaderId,
            originalText,
            alternativeText
          });
        } catch (genError) {
          console.error("Error generating leader alternative:", genError);
          return res.status(500).json({ 
            message: "Failed to generate leader alternative",
            error: genError instanceof Error ? genError.message : "Unknown error"
          });
        }
      }
      
      return res.json({
        success: true,
        alternative
      });
    } catch (error) {
      console.error("Error in leader alternative endpoint:", error);
      return res.status(500).json({ message: "Server error processing request" });
    }
  });
  
  // Endpoint to get user's word usage statistics for billing
  app.get("/api/usage/words", requireAuth, async (req, res) => {
    try {
      // Get user details to check when billing cycle resets
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get current billing cycle usage
      const currentUsage = await storage.getCurrentWordUsage(req.session.userId!);
      
      // Get the current billing cycle for additional information
      const currentCycle = await storage.getCurrentBillingCycle(req.session.userId!);
      
      // Calculate days remaining in current cycle
      let daysRemaining = 0;
      let cycleStartDate = '';
      let cycleEndDate = '';
      
      if (currentCycle) {
        const now = new Date();
        const endDate = new Date(currentCycle.cycleEndDate);
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Format dates for frontend display
        cycleStartDate = new Date(currentCycle.cycleStartDate).toISOString().split('T')[0];
        cycleEndDate = new Date(currentCycle.cycleEndDate).toISOString().split('T')[0];
      }
      
      // Get all historical usage data
      const usageHistory = await storage.getUserWordUsage(req.session.userId!);
      
      // Convert historical data for backward compatibility with frontend
      const formattedHistory = usageHistory.map(cycle => {
        // Get the month and year from the cycle start date for display
        const cycleDate = new Date(cycle.cycleStartDate);
        return {
          ...cycle,
          // Add these fields for backward compatibility with existing frontend
          year: cycleDate.getUTCFullYear(),
          month: cycleDate.getUTCMonth() + 1,
          // Keep a display name for the cycle
          displayName: `${cycleDate.toLocaleString('default', { month: 'long' })} ${cycleDate.getUTCFullYear()}`
        };
      });
      
      return res.json({
        currentMonthUsage: currentUsage,
        history: formattedHistory,
        billingCycle: {
          startDate: cycleStartDate,
          endDate: cycleEndDate,
          daysRemaining,
          cycleNumber: currentCycle?.cycleNumber || 1
        }
      });
    } catch (error) {
      console.error("Error fetching word usage statistics:", error);
      return res.status(500).json({ message: "Failed to retrieve word usage data" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
