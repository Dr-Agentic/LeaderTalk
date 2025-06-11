import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
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
  // Configure CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Configure session middleware
  const isProduction = config.nodeEnv === 'production';
  
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
  
  const sessionConfig = {
    store: sessionStore,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    name: 'leadertalk.sid', // Force override of default connect.sid
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' for production CORS
      path: '/', // Explicitly set cookie path
      domain: isProduction ? '.leadertalk.app' : undefined // Subdomain support for production
    }
  };

  console.log(`🍪 Session Configuration:`, {
    cookieName: sessionConfig.name,
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    domain: sessionConfig.cookie.domain,
    environment: isProduction ? 'production' : 'development'
  });

  app.use(session(sessionConfig));

  // Add comprehensive session debugging middleware
  app.use((req, res, next) => {
    // Log session store health
    if (isProduction && req.sessionStore) {
      req.sessionStore.get(req.sessionID, (err, sessionData) => {
        if (err) {
          console.error('🚨 PROD: Session store error:', err);
        } else {
          console.log('🔍 PROD: Session store lookup:', {
            sessionId: req.sessionID?.substring(0, 8) + '...',
            dataExists: !!sessionData,
            userId: sessionData?.userId || null
          });
        }
      });
    }
    
    if (isProduction) {
      const originalSetHeader = res.setHeader.bind(res);
      res.setHeader = function(name: string, value: any) {
        if (name.toLowerCase() === 'set-cookie') {
          console.log('🍪 PROD: Setting cookie:', value);
        }
        return originalSetHeader(name, value);
      };
    }
    next();
  });

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