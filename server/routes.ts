import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import crypto from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import { config } from "./config/environment";
import { pool } from "./db";

// Import the modular route registrations
import { registerAllRoutes } from "./routes/index";

// Get the directory path for our project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MemoryStoreFactory = MemoryStore(session);
const PostgresStore = connectPgSimple(session);

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
  // Configure session middleware
  const isProduction = config.nodeEnv === 'production';
  
  // Configure CORS with explicit domain handling for production
  const corsOrigin = isProduction 
    ? ['https://app.leadertalk.app', 'https://leadertalk.app']
    : true; // Allow all origins in development
    
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false
  }));
  
  // Create session store based on environment
  const sessionStore = isProduction 
    ? new PostgresStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 24 * 60 * 60, // Prune expired sessions every 24 hours
      })
    : new MemoryStoreFactory({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
  
  console.log(`📦 Session Store: ${isProduction ? 'PostgreSQL' : 'Memory'}`);
  
  if (isProduction && !config.session.cookieDomain) {
    throw new Error('Cookie domain must be set in production environment');
  }
  
  const productionDomain = isProduction ? config.session.cookieDomain : undefined;
  
  const sessionConfig = {
    store: sessionStore,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    name: 'leadertalk.sid',
    genid: () => {
      return crypto.webcrypto.getRandomValues(new Uint8Array(16))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
    },
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
      domain: productionDomain
    }
  };

  // Configure session middleware
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