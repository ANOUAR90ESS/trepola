import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (global._postgresPool === undefined) {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        ssl: connectionString.includes('supabase') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        connectionTimeoutMillis: 5000,
      });

      global._postgresPool.on('error', (err) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    } else {
      console.warn('DATABASE_URL not set in process.env. Database pool disabled.');
      global._postgresPool = undefined;
    }
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = pool ? drizzle(pool, { schema }) : null;
