import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";
import { config } from "./config/environment";
import { createSessionConfig } from "./sessionConfig";

// Import the modular route registrations
import { registerAllRoutes } from "./routes/index";

// Get the directory path for our project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function servePublicFiles(app: Express) {
  // Serve static files from the public directory
  const publicPath = path.resolve(process.cwd(), 'public');
  console.log('Setting up static file serving from:', publicPath);
  
  app.use('/assets', express.static(path.join(publicPath, 'assets'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
      if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
  
  // Also serve root public files
  app.use(express.static(publicPath));
}

export async function registerRoutes(app: Express): Promise<Server> {
  const isProduction = config.nodeEnv === 'production';
  
  // Handle SPA routes by serving index.html for non-API routes
  const spaRoutes = ['/auth/callback', '/onboarding', '/dashboard', '/login'];
  
  spaRoutes.forEach(route => {
    app.get(route, (req, res) => {
      const indexPath = path.resolve(process.cwd(), 'client', 'index.html');
      res.sendFile(indexPath);
    });
  });

  // Configure CORS
  const corsOrigin = isProduction 
    ? ['https://app.leadertalk.app', 'https://leadertalk.app']
    : true;
    
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false
  }));
  
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Configure session middleware with clean config
  const sessionConfig = createSessionConfig();
  app.use(session(sessionConfig));





  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Register all modular routes FIRST
  registerAllRoutes(app);

  // Add a catch-all for unmatched API routes to prevent Vite from handling them
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
  });

  // Serve static files AFTER API routes
  servePublicFiles(app);

  // Create HTTP server
  const server = createServer(app);

  return server;
}