import { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

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