import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { insertUserSchema, updateUserSchema } from "@shared/schema";
import { getBillingCycleWordUsageAnalytics } from "../subscriptionController";
import { z } from "zod";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerUserRoutes(app: Express) {
  // Get current user info
  app.get("/api/users/me", async (req, res, next) => {
    try {

      
      const userId = req.session?.userId;
      if (!userId) {
        console.log("No user ID in session");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error in /api/users/me:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user word usage
  app.get("/api/users/word-usage", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const billingData = await getBillingCycleWordUsageAnalytics(userId);
      
      res.json({
        currentUsage: billingData.analytics.currentUsage,
        wordLimit: billingData.analytics.wordLimit,
        billingCycle: {
          startDate: billingData.analytics.billingCycleProgress.cycleStart.toISOString().split('T')[0],
          endDate: billingData.analytics.billingCycleProgress.cycleEnd.toISOString().split('T')[0]
        },
        usagePercentage: billingData.analytics.usagePercentage
      });
    } catch (error) {
      console.error("Error fetching word usage:", error);
      res.status(500).json({ error: "Failed to fetch word usage data" });
    }
  });

  // Delete user records
  app.post("/api/users/delete-records", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get all user's recordings
      const recordings = await storage.getRecordings(userId);
      
      // Delete all recordings (this will cascade to delete related data)
      for (const recording of recordings) {
        // In a real implementation, you'd want to do this in a transaction
        // For now, we'll just delete the recordings
        await storage.updateRecording(recording.id, { status: 'deleted' });
      }

      // Reset word usage for current billing cycle
      const wordUsages = await storage.getUserWordUsage(userId);
      for (const usage of wordUsages) {
        await storage.updateUserWordUsage(usage.id, { wordCount: 0 });
      }

      res.json({ 
        success: true, 
        message: `Deleted ${recordings.length} recordings and reset word usage`,
        deletedCount: recordings.length
      });
    } catch (error) {
      console.error("Error deleting user records:", error);
      res.status(500).json({ error: "Failed to delete user records" });
    }
  });

  // Delete user account
  app.post("/api/users/delete-account", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // In a real implementation, you'd want to:
      // 1. Cancel any active subscriptions
      // 2. Delete all user data in a transaction
      // 3. Anonymize rather than delete for audit purposes
      
      // For now, we'll just clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session during account deletion:", err);
        }
        
        res.clearCookie('leadertalk.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        res.json({ 
          success: true, 
          message: "Account deletion initiated. You have been logged out."
        });
      });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Create/register new user
  app.post("/api/users", async (req, res) => {
    try {
      console.log("Creating user with data:", req.body);
      
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists by email
      let existingUser = null;
      if (userData.email) {
        existingUser = await storage.getUserByEmail(userData.email);
      }
      
      // Check if user exists by Google ID
      if (!existingUser && userData.googleId) {
        existingUser = await storage.getUserByGoogleId(userData.googleId);
      }
      
      let user;
      if (existingUser) {
        // Update existing user with new data
        console.log("User exists, updating:", existingUser.id);
        user = await storage.updateUser(existingUser.id, {
          ...userData,
          // Preserve existing data if not provided
          username: userData.username || existingUser.username,
          email: userData.email || existingUser.email
        });
      } else {
        // Create new user
        console.log("Creating new user");
        user = await storage.createUser(userData);
      }
      
      if (!user) {
        return res.status(500).json({ error: "Failed to create or update user" });
      }
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Save session and respond
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        console.log("User created/updated successfully:", user.id);
        res.json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}