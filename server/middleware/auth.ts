import { Request, Response, NextFunction } from "express";

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

/**
 * Enterprise authentication middleware
 * Single source of truth for API route protection
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};
