import { sql } from 'drizzle-orm';
import { check, pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid, authUsers } from 'drizzle-orm/supabase';

// Source of truth for tables and RLS policies. After editing, run `npm run db:generate -- --name=<change>`
// to write a migration into `supabase/migrations`, then apply it with `npm run db:migrate`.
// Grants, triggers and extensions that Drizzle cannot express go into custom migrations
// (`npm run db:generate -- --custom --name=<change>`).

/** Minimal user-owned record that demonstrates Supabase Auth + RLS. Replace with your product schema. */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('profiles_display_name_check', sql`char_length(${table.displayName}) between 1 and 50`),
    pgPolicy('Owners can read their profile', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy('Owners can create their profile', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
    pgPolicy('Owners can update their profile', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
  ],
).enableRLS();
