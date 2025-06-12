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
  // OAuth callback route - handles Google OAuth redirects
  app.get("/auth/callback", (req, res) => {
    console.log("OAuth callback route reached:", new Date().toISOString());
    console.log("Query params:", req.query);
    
    // For OAuth flows, we need to serve the React app to handle the callback
    // The React app will process the auth state and make the API call
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LeaderTalk - Authentication</title>
  <style>
    body { 
      margin: 0; 
      font-family: system-ui, -apple-system, sans-serif; 
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .loading {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Completing authentication...</p>
  </div>
  <script>
    // Process authentication callback and redirect
    const urlParams = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.substring(1));
    
    console.log('Processing auth callback');
    console.log('URL params:', Object.fromEntries(urlParams));
    console.log('Fragment params:', Object.fromEntries(fragment));
    
    // Check for errors
    const error = urlParams.get('error') || fragment.get('error');
    if (error) {
      console.error('OAuth error:', error);
      window.location.href = '/login?error=' + encodeURIComponent(error);
      return;
    }
    
    // Get auth code or access token
    const code = urlParams.get('code');
    const accessToken = fragment.get('access_token');
    
    if (code || accessToken) {
      // Redirect to our React app's auth callback page for processing
      window.location.href = '/auth-callback' + window.location.search + window.location.hash;
    } else {
      console.error('No auth code or token found');
      window.location.href = '/login?error=no_auth_data';
    }
  </script>
</body>
</html>`;
    
    res.send(html);
  });

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
          domain: process.env.NODE_ENV === "production" 
            ? process.env.PROD_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN
            : undefined
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
      console.log("=== SUPABASE CALLBACK ENDPOINT REACHED ===");
      console.log("Request body:", req.body);
      console.log("Session ID before auth:", req.sessionID);
      
      const { uid, email, displayName, photoURL, emailVerified } = req.body;

      if (!uid || !email) {
        console.log("Missing required fields - uid or email");
        return res
          .status(400)
          .json({ error: "Invalid user data from Supabase" });
      }

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
        if (!user.googleId) {
          console.log("Updating existing user with Supabase ID");
          const updatedUser = await storage.updateUser(user.id, {
            photoUrl: photoURL || user.photoUrl,
            googleId: uid
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

      // Store user data for callback scope to avoid TypeScript undefined errors
      const forceOnboarding = !user.selectedLeaders?.length;
      const selectedLeaders = user.selectedLeaders;

      // Log that we reached this point
      console.log(`Authentication callback reached for user ${user.id} in ${config.nodeEnv} environment`);

      // Set user ID in session and regenerate to force cookie creation
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.error("Session regeneration error:", regenErr);
          return res.status(500).json({ error: "Failed to create session" });
        }
        
        // Set user ID in fresh session
        req.session.userId = user.id;
        
        // Save the new session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }

          // Log cookie being set in production
          if (config.isProduction) {
            console.log("Production session saved successfully");
            console.log("Session ID after save:", req.sessionID);
            console.log("User ID in session:", req.session.userId);
            
            // Manually set the session cookie since Express isn't doing it
            const cookieValue = `leadertalk.sid=${req.sessionID}; Domain=app.leadertalk.app; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800`;
            res.setHeader('Set-Cookie', cookieValue);
            console.log("Manually set cookie:", cookieValue);
            console.log("Response headers being sent:", res.getHeaders());
          }
          
          res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              photoUrl: user.photoUrl || null
            },
            forceOnboarding,
            selectedLeaders
          });
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
