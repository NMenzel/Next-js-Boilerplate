import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/models/Schema';
import { Env } from './Env';
import { logger } from './Logger';

const createDb = () => {
  const pool = new Pool({ connectionString: Env.DATABASE_URL });

  pool.on('error', (error) => {
    logger.error('Database pool error', { message: error.message });
  });

  return drizzle({ client: pool, schema });
};

declare global {
  var cachedDrizzle: ReturnType<typeof createDb> | undefined;
}

// Reuse one pool across hot reloads in development.
const db = globalThis.cachedDrizzle ?? createDb();

if (Env.NODE_ENV !== 'production') {
  globalThis.cachedDrizzle = db;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Extracts the Postgres error code for logging. Drizzle error messages embed query parameters,
 * so never log them.
 * @param error The error thrown by a query.
 * @returns The SQLSTATE code, e.g. `42501`, or `unknown`.
 */
export const getDatabaseErrorCode = (error: unknown) => {
  const cause = error instanceof Error ? error.cause : undefined;

  return cause instanceof Error && 'code' in cause && typeof cause.code === 'string'
    ? cause.code
    : 'unknown';
};

/**
 * Runs queries as the signed-in user so that Row Level Security applies. The connection itself is
 * privileged, so app code must not query outside this helper.
 * @param claims The verified JWT claims from `requireUserClaims()`.
 * @param run The queries to run inside the transaction.
 * @returns The result of `run`.
 */
export const withRls = async <T>(claims: { sub: string }, run: (tx: Transaction) => Promise<T>) =>
  await db.transaction(async (tx) => {
    // Bound parameters, never string-interpolated: claims may contain user-supplied metadata.
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true), set_config('request.jwt.claim.sub', ${claims.sub}, true)`,
    );
    await tx.execute(sql`set local role authenticated`);

    return await run(tx);
  });
