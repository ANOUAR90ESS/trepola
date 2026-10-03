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
      try {
        global._postgresPool = new Pool({
          connectionString,
          ssl: connectionString.includes('supabase') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          max: 10,
          connectionTimeoutMillis: 5000,
        });

        global._postgresPool.on('error', (err) => {
          console.error('Unexpected error on idle SQL pool client:', err);
        });
      } catch (err) {
        console.warn('Postgres pool creation failed:', err);
        global._postgresPool = undefined;
      }
    } else {
      global._postgresPool = undefined;
    }
  }
  return global._postgresPool;
};

const pool = createPool();

function createDbMock() {
  const createChainable = (resolvedValue: any = []) => {
    const target: any = () => target;
    const promise = Promise.resolve(resolvedValue);
    target.then = promise.then.bind(promise);
    target.catch = promise.catch.bind(promise);
    target.finally = promise.finally.bind(promise);
    target.from = () => target;
    target.where = () => target;
    target.orderBy = () => target;
    target.limit = () => target;
    target.offset = () => target;
    target.values = (vals: any) => createChainable(Array.isArray(vals) ? vals : [vals]);
    target.set = () => target;
    target.onConflictDoNothing = () => target;
    target.onConflictDoUpdate = () => target;
    target.returning = () => target;
    return target;
  };

  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({})
  };

  return new Proxy({}, {
    get: (_, prop: string) => {
      if (prop === 'query') {
        return new Proxy({}, { get: () => noOp });
      }
      return () => createChainable([]);
    }
  }) as any;
}

let dbInstance: any = null;
try {
  if (pool) {
    dbInstance = drizzle(pool, { schema });
  } else {
    console.warn('[AI Studio] Database not connected — using mock');
    dbInstance = createDbMock();
  }
} catch {
  console.warn('[AI Studio] Database connection error — using mock');
  dbInstance = createDbMock();
}

export const db = dbInstance;
