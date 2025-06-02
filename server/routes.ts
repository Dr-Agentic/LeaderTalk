import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { config } from "./config/environment";

// Import the modular route registrations
import { registerAllRoutes } from "./routes/index";

// Get the directory path for our project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MemoryStoreFactory = MemoryStore(session);

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
  // Configure CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Configure session middleware
  const isProduction = config.nodeEnv === 'production';
  

  
  app.use(session({
    store: new MemoryStoreFactory({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'none' : 'lax',
      domain: config.session.cookieDomain || undefined // Use configured domain or default to current domain
    },
    name: 'leadertalk.sid'
  }));

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Register all modular routes FIRST
  registerAllRoutes(app);

  // Serve static files AFTER API routes
  servePublicFiles(app);

  // Create HTTP server
  const server = createServer(app);

  return server;
}