import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';

// Required for Neon connection on Replit
if (process.env.DATABASE_URL?.includes('pooler')) {
  neonConfig.webSocketConstructor = ws;
}

// Ensure database URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle instance using the pool and schema
export const db = drizzle(pool, { schema });