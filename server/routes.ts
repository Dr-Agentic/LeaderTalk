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
  
  // Debug and validate cookie domain configuration
  console.log('🔍 Session Domain Debug:', {
    isProduction,
    configCookieDomain: config.session.cookieDomain,
    NODE_ENV: process.env.NODE_ENV,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    PROD_COOKIE_DOMAIN: process.env.PROD_COOKIE_DOMAIN
  });
  
  if (isProduction && !config.session.cookieDomain) {
    throw new Error('❌ CRITICAL: COOKIE_DOMAIN or PROD_COOKIE_DOMAIN must be set in production environment');
  }
  
  const productionDomain = isProduction ? config.session.cookieDomain : undefined;
  
  // Clear any potential existing session middleware in production
  if (isProduction && app._router && app._router.stack) {
    console.log('🧹 PROD: Clearing existing session middleware to prevent connect.sid conflicts');
    const originalStackLength = app._router.stack.length;
    app._router.stack = app._router.stack.filter((layer: any) => {
      const name = layer.handle?.name;
      const isSessionMiddleware = name === 'session' || name === 'sessionMiddleware' || 
                                  (layer.handle && layer.handle.toString().includes('connect.sid'));
      if (isSessionMiddleware) {
        console.log('🗑️ PROD: Removed existing session middleware:', name);
      }
      return !isSessionMiddleware;
    });
    console.log(`🧹 PROD: Stack cleaned: ${originalStackLength} -> ${app._router.stack.length} middleware`);
  }
  
  const sessionConfig = {
    store: sessionStore,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    name: 'leadertalk.sid', // Force override of default connect.sid
    genid: () => {
      // Custom session ID generator to ensure uniqueness
      return crypto.webcrypto.getRandomValues(new Uint8Array(16))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
    },
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'lax' as const : 'lax' as const, // Use 'lax' for production domain compatibility
      path: '/', // Explicitly set cookie path
      domain: undefined // Let browser use current domain automatically
    }
  };

  console.log(`🍪 Session Configuration:`, {
    cookieName: sessionConfig.name,
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    domain: sessionConfig.cookie.domain,
    environment: isProduction ? 'production' : 'development',
    configuredCookieDomain: config.session.cookieDomain,
    fallbackDomain: productionDomain,
    httpOnly: sessionConfig.cookie.httpOnly,
    maxAge: sessionConfig.cookie.maxAge,
    path: sessionConfig.cookie.path
  });

  // Force session configuration in production to override any Replit defaults
  if (isProduction) {
    console.log('🚨 PROD: Forcing session configuration to override Replit defaults');
    console.log('🚨 PROD: Expected cookie name: leadertalk.sid (NOT connect.sid)');
    console.log('🚨 PROD: Expected domain:', productionDomain);
  }

  // Add session creation interceptor to prove our theory
  const originalSession = session(sessionConfig);
  
  app.use((req, res, next) => {
    const hadSessionBefore = !!req.headers.cookie && req.headers.cookie.includes('sid');
    const cookiesBeforeSession = req.headers.cookie || 'none';
    
    console.log('🔍 PRE-SESSION:', {
      hadSessionBefore,
      cookiesReceived: cookiesBeforeSession,
      hasLeadertalkSid: cookiesBeforeSession.includes('leadertalk.sid'),
      hasConnectSid: cookiesBeforeSession.includes('connect.sid'),
      timestamp: new Date().toISOString()
    });
    
    // Call the actual session middleware
    originalSession(req, res, (err) => {
      if (err) {
        console.error('Session middleware error:', err);
        return next(err);
      }
      
      // Check what happened after session middleware ran
      const sessionCreated = !!req.session;
      const sessionId = req.sessionID;
      
      console.log('🔍 POST-SESSION:', {
        sessionCreated,
        sessionId: sessionId?.substring(0, 8) + '...',
        sessionWasNew: !hadSessionBefore && sessionCreated,
        cookieToBeSet: sessionCreated ? 'Will be set in response' : 'None',
        configuredName: sessionConfig.name,
        timestamp: new Date().toISOString()
      });
      
      // Intercept the response to see exactly what cookie is being set
      const originalSetHeader = res.setHeader;
      res.setHeader = function(name: string, value: any) {
        if (name.toLowerCase() === 'set-cookie') {
          console.log('🍪 ACTUAL COOKIE BEING SET:', {
            header: name,
            value: Array.isArray(value) ? value : [value],
            containsLeadertalk: JSON.stringify(value).includes('leadertalk.sid'),
            containsConnect: JSON.stringify(value).includes('connect.sid'),
            timestamp: new Date().toISOString()
          });
        }
        return originalSetHeader.call(this, name, value);
      };
      
      next();
    });
  });

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