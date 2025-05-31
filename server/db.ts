import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';
import { config } from './config/environment';

// Required for Neon database connections in Node.js environments
neonConfig.webSocketConstructor = ws;

// Create a PostgreSQL connection pool using centralized configuration
export const pool = new Pool({
  connectionString: config.database.url,
});

// Create a drizzle instance using the pool and schema
export const db = drizzle(pool, { schema });