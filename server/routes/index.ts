import { Express } from "express";
import { registerAuthRoutes } from "./auth";
import { registerUserRoutes } from "./users";
import { registerLeaderRoutes } from "./leaders";
import { registerRecordingRoutes } from "./recordings";
import { registerBillingRoutes } from "./billing";
import { registerTrainingRoutes } from "./training";
import { registerAdminRoutes } from "./admin";
import { registerDebugRoutes } from "./debug";
import { registerUsageRoutes } from "./usage";
import { registerMobileBillingRoutes } from "./mobile-billing";
import landingRouter from "./landing";

/**
 * Register all route modules with the Express app
 */
export function registerAllRoutes(app: Express) {
  // Landing page routes (must be registered first for root path handling)
  app.use('/', landingRouter);
  
  // Authentication routes
  registerAuthRoutes(app);
  
  // User management routes
  registerUserRoutes(app);
  
  // Leader-related routes
  registerLeaderRoutes(app);
  
  // Recording management routes
  registerRecordingRoutes(app);
  
  // Clean billing API routes
  registerBillingRoutes(app);
  
  // Mobile billing API routes
  registerMobileBillingRoutes(app);
  
  // Usage tracking routes
  registerUsageRoutes(app);
  
  // Training content routes
  registerTrainingRoutes(app);
  
  // Admin functionality routes
  registerAdminRoutes(app);
  
  // Debug and health check routes
  registerDebugRoutes(app);
  
  console.log("✅ All route modules registered successfully");
}