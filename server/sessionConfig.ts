/**
 * Clean session configuration module
 * Handles session setup without debugging clutter
 */
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { config } from "./config/environment";
import { pool } from "./db";

const MemoryStoreFactory = MemoryStore(session);
const PostgresStore = connectPgSimple(session);

export function createSessionConfig() {
  const isProduction = config.nodeEnv === 'production';
  
  // Create session store
  const sessionStore = isProduction 
    ? new PostgresStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 24 * 60 * 60,
      })
    : new MemoryStoreFactory({
        checkPeriod: 86400000
      });

  // Production cookie configuration
  const cookieConfig = {
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax' as const, // Use 'lax' for both dev and prod
    path: '/'
  } as any;

  // Don't set domain in production - let browser handle it automatically
  // This avoids cross-domain cookie issues on Replit

  return {
    store: sessionStore,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    name: 'leadertalk.sid',
    cookie: cookieConfig
  };
}