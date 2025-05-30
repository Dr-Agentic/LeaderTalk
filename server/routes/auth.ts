import { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Extend session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export function registerAuthRoutes(app: Express) {
  // Logout endpoint
  app.get("/api/auth/logout", (req, res, next) => {
    try {
      // Clear the session cookie by destroying it
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        
        // Clear the cookie from the browser
        res.clearCookie('leadertalk.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          domain: process.env.NODE_ENV === 'production' ? '.replit.app' : undefined
        });
        
        res.json({ success: true, message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error during logout" });
    }
  });

  // Force login endpoint (for testing)
  app.get("/api/auth/force-login", async (req, res) => {
    try {
      const testUserId = 1;
      const user = await storage.getUser(testUserId);
      
      if (!user) {
        return res.status(404).json({ error: "Test user not found" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Save session and respond
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        res.json({ 
          success: true, 
          message: "Force login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    } catch (error) {
      console.error("Force login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Regular login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // In a real app, you'd verify the password hash here
      // For now, we'll accept any password for demo purposes
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Save session and respond
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Supabase authentication callback endpoint
  app.post("/api/auth/supabase-callback", async (req, res) => {
    try {
      const { uid, email, displayName, photoURL, emailVerified } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: "Invalid user data from Supabase" });
      }
      
      console.log("Processing Supabase authentication for:", { uid, email, displayName });
      
      // Try to find existing user by email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        console.log("Creating new user from Supabase data");
        user = await storage.createUser({
          username: displayName || email.split('@')[0],
          email: email,
          googleId: uid, // Store Supabase user ID as googleId for compatibility
          photoUrl: photoURL || null
        });
        console.log("New user created:", user.id);
      } else {
        // Update existing user with Supabase ID if not set
        if (!user.googleId) {
          console.log("Updating existing user with Supabase ID");
          user = await storage.updateUser(user.id, { photoUrl: photoURL || user.photoUrl });
        }
      }
      
      // Set user ID in session with explicit session regeneration
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to regenerate session" });
        }
        
        // Set user ID in the new session
        req.session.userId = user!.id;
        
        // Save session and respond
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }
          
          console.log("Supabase authentication successful for user:", user!.id);
          console.log("Session ID after auth:", req.sessionID);
          
          res.json({ 
            success: true, 
            user: {
              id: user!.id,
              username: user!.username,
              email: user!.email,
              photoUrl: user!.photoUrl,
              forceOnboarding: !user!.selectedLeaders?.length,
              selectedLeaders: user!.selectedLeaders
            }
          });
        });
      });
    } catch (error) {
      console.error("Supabase authentication error:", error);
      res.status(500).json({ error: "Internal server error during authentication" });
    }
  });

  // Demo login endpoint
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      // For demo purposes, we'll use a hardcoded demo user
      const demoUser = {
        id: 999,
        username: "Demo User",
        email: "demo@example.com"
      };
      
      // Set demo user ID in session
      req.session.userId = demoUser.id;
      
      // Save session and respond
      req.session.save((err) => {
        if (err) {
          console.error("Demo session save error:", err);
          return res.status(500).json({ error: "Failed to save demo session" });
        }
        
        res.json({ 
          success: true, 
          message: "Demo login successful",
          user: demoUser
        });
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}