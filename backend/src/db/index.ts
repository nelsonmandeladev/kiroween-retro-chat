import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Logger } from 'drizzle-orm/logger';
import * as schema from './schema';

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the SQL client
const sql = neon(process.env.DATABASE_URL);

// Custom logger for development
class CustomLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 SQL Query:', query);
      if (params.length > 0) {
        console.log('📝 Parameters:', params);
      }
    }
  }
}

// Create the database instance with schema and optional logging
export const db = drizzle({
  client: sql,
  schema,
  logger:
    process.env.NODE_ENV === 'development' ? new CustomLogger() : undefined,
});

// Export the SQL client for advanced use cases
export { sql };

// Export database type for use in other files
export type Database = typeof db;
