import { defineConfig } from 'drizzle-kit';

// Drizzle Kit only generates SQL migrations; the Supabase CLI applies them (`npm run db:migrate`),
// so no database credentials are needed here.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/models/Schema.ts',
  out: './supabase/migrations',
  migrations: { prefix: 'supabase' },
  schemaFilter: ['public'],
  entities: { roles: { provider: 'supabase' } },
  strict: true,
  verbose: true,
});
