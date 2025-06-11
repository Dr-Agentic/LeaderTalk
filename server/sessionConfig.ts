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

  // Basic session configuration
  return {
    store: sessionStore,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    name: 'leadertalk.sid',
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: isProduction ? 'none' as const : 'lax' as const,
      path: '/',
      domain: isProduction ? config.session.cookieDomain : undefined
    }
  };
}