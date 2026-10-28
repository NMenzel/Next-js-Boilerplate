import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    // Postgres connection for Drizzle (server-only secret). Queries run through `withRls()`.
    DATABASE_URL: z.url(),
    // Build-time only: Sentry source map upload
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
  },
  client: {
    // Base URL of auth email links; a missing value would send production links to localhost.
    // Trailing slashes are removed because paths are appended (`${NEXT_PUBLIC_APP_URL}/sitemap.xml`).
    NEXT_PUBLIC_APP_URL: z.url().transform((url) => url.replace(/\/+$/u, '')),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_LOGGING_LEVEL: z
      .enum(['error', 'info', 'debug', 'warning', 'trace', 'fatal'])
      .default('info'),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
    CI: z.string().optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_LOGGING_LEVEL: process.env.NEXT_PUBLIC_LOGGING_LEVEL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    DATABASE_URL: process.env.DATABASE_URL,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    CI: process.env.CI,
  },
});
