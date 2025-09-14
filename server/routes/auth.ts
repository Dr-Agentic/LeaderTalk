import { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { config } from "../config/environment";

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export function registerAuthRoutes(app: Express) {
  // Auth parameters endpoint - returns environment-specific Supabase config
  app.get("/api/auth/auth-parameters", (req, res) => {
    try {
      const supabaseUrl = config.supabase.url;
      const supabaseAnonKey = config.supabase.anonKey;

      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({
          error: "Supabase configuration missing",
          environment: config.isProduction ? "production" : "development",
        });
      }

      res.json({
        supabaseUrl,
        supabaseAnonKey,
        environment: config.isProduction ? "production" : "development",
        revenueCat: {
          iosApiKey: config.revenueCat.iosApiKey,
          androidApiKey: config.revenueCat.androidApiKey,
        },
      });
    } catch (error) {
      console.error("Auth parameters error:", error);
      res.status(500).json({ error: "Failed to get auth parameters" });
    }
  });

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
        res.clearCookie("leadertalk.sid", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          domain:
            process.env.NODE_ENV === "production"
              ? process.env.PROD_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN
              : undefined,
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
            email: user.email,
          },
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
        return res
          .status(400)
          .json({ error: "Email and password are required" });
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
            email: user.email,
          },
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
        return res
          .status(400)
          .json({ error: "Invalid user data from Supabase" });
      }

      // Parse cookies to debug the mismatch issue
      const cookies = req.headers.cookie
        ? req.headers.cookie.split(";").reduce((acc: any, cookie) => {
            const [name, value] = cookie.trim().split("=");
            acc[name] = value;
            return acc;
          }, {})
        : {};

      /*
      console.log("🔐 AUTH CALLBACK COOKIE DEBUG:", {
        expectedCookieName: "leadertalk.sid",
        hasLeadertalkSid: !!cookies["leadertalk.sid"],
        hasConnectSid: !!cookies["connect.sid"],
        allCookieNames: Object.keys(cookies),
        sessionIdBefore: req.sessionID?.substring(0, 8) + "...",
        sessionReceived: req.session,
      });
      */

      console.log("Processing Supabase authentication for:", {
        uid,
        email,
        displayName,
      });

      // Try to find existing user by email
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user
        console.log("Creating new user from Supabase data");
        user = await storage.createUser({
          username: displayName || email.split("@")[0],
          email: email,
          googleId: uid, // Store Supabase user ID as googleId for compatibility
          photoUrl: photoURL || null,
        });
        console.log("New user created:", user.id);
      } else {
        // Update existing user with Supabase ID if not set
        console.log("Existing user found:", user.id, user.googleId);
        if (!user.googleId || user.googleId !== uid) {
          console.log(
            "Updating existing user with Supabase ID",
            user.googleId,
            uid,
          );
          const updatedUser = await storage.updateUser(user.id, {
            photoUrl: photoURL || user.photoUrl,
            googleId: uid,
          });
          if (updatedUser) {
            user = updatedUser;
          }
        }
      }

      if (!user) {
        console.error("User creation/update failed");
        return res
          .status(500)
          .json({ error: "Failed to create or update user" });
      }

      // Set user ID in session directly (no regeneration to avoid production issues)
      req.session.userId = user.id;

      console.log("Setting userId in session:", user.googleId);
      console.log("Session ID before save:", req.sessionID);
      console.log(
        "Session object before save:",
        JSON.stringify(req.session, null, 2),
      );

      // Store user data for callback scope to avoid TypeScript undefined errors
      const forceOnboarding = !user.selectedLeaders?.length;
      const selectedLeaders = user.selectedLeaders;

      // Save session and respond
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ error: "Failed to save session" });
        }

        console.log(
          "Supabase authentication successful for database user ID:",
          user.id,
        );
        console.log("Session ID after save:", req.sessionID);
        console.log("Session userId after save:", req.session.userId);
        console.log("Production mode:", config.isProduction);
        console.log("Cookie domain:", config.session.cookieDomain);
        console.log("Setting cookie:", res.getHeader("Set-Cookie"));

        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            photoUrl: user.photoUrl,
            forceOnboarding,
            selectedLeaders,
          },
        });
      });
    } catch (error) {
      console.error("Supabase authentication error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during authentication" });
    }
  });

  // Demo login endpoint
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      // For demo purposes, we'll use a hardcoded demo user
      const demoUser = {
        id: 999,
        username: "Demo User",
        email: "demo@example.com",
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
          user: demoUser,
        });
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test session save endpoint for debugging
  app.post("/api/auth/test-session-save", async (req, res) => {
    try {
      console.log("Testing session save in production");
      console.log("Session before test:", {
        sessionId: req.sessionID,
        userId: req.session.userId,
      });

      // Set a test user ID
      req.session.userId = 2; // Your existing user ID

      console.log("Set userId to 2, attempting save");

      req.session.save((err) => {
        if (err) {
          console.error("Test session save error:", err);
          return res.status(500).json({
            error: "Failed to save test session",
            details: err.message,
            sessionId: req.sessionID,
          });
        }

        console.log("Test session save successful");
        console.log("Session after save:", {
          sessionId: req.sessionID,
          userId: req.session.userId,
        });

        res.json({
          success: true,
          message: "Test session save successful",
          sessionId: req.sessionID,
          userId: req.session.userId,
        });
      });
    } catch (error) {
      console.error("Test session error:", error);
      res.status(500).json({
        error: "Test session error",
        details: (error as Error).message,
      });
    }
  });
}
