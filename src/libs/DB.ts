import { DrizzleQueryError, sql } from 'drizzle-orm';
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

const getErrorCode = (value: unknown) =>
  value instanceof Error && 'code' in value && typeof value.code === 'string'
    ? value.code
    : undefined;

/**
 * Extracts the Postgres error code for logging. Drizzle error messages embed query parameters,
 * so never log them. Drizzle wraps query errors (code on `cause`), `withRls()` rethrows them with
 * the code only, and connection errors from `pg` are not wrapped.
 * @param error The error thrown by a query.
 * @returns The SQLSTATE code, e.g. `42501`, a connection error code such as `ECONNREFUSED`, or
 * `unknown`.
 */
export const getDatabaseErrorCode = (error: unknown) =>
  getErrorCode(error instanceof Error ? error.cause : undefined) ??
  getErrorCode(error) ??
  'unknown';

/**
 * Runs queries as the signed-in user so that Row Level Security applies. The connection itself is
 * privileged, so app code must not query outside this helper.
 * @param claims The verified JWT claims from `requireUserClaims()`.
 * @param run The queries to run inside the transaction.
 * @returns The result of `run`.
 * @throws {Error} An error that carries only the database error code when a query fails.
 */
export const withRls = async <T>(claims: { sub: string }, run: (tx: Transaction) => Promise<T>) => {
  try {
    return await db.transaction(async (tx) => {
      // One round trip; transaction-local settings. Bound parameters, never string-interpolated:
      // claims may contain user-supplied metadata.
      await tx.execute(
        sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true), set_config('request.jwt.claim.sub', ${claims.sub}, true), set_config('role', 'authenticated', true)`,
      );

      return await run(tx);
    });
  } catch (error) {
    // Query errors embed the SQL, its parameters (here the claims, including the email) and the
    // failing row. Next.js logs unhandled errors in full, so keep only the code.
    if (error instanceof DrizzleQueryError) {
      const code = getDatabaseErrorCode(error);

      throw Object.assign(new Error(`Database query failed (${code})`), { code });
    }

    throw error;
  }
};
