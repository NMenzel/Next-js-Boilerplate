import { eq } from 'drizzle-orm';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { profiles } from '@/models/Schema';
import { getDatabaseErrorCode, withRls } from './DB';
import { Env } from './Env';

// Requires the local Supabase stack: `npm run db:start`. Run with `npm run test:db`.
const owner = crypto.randomUUID();
const other = crypto.randomUUID();
const admin = new Client({ connectionString: Env.DATABASE_URL });

describe(withRls, () => {
  beforeAll(async () => {
    await admin.connect();
    await admin.query(
      `insert into auth.users (id, email, aud, role)
       values ($1, $2, 'authenticated', 'authenticated'), ($3, $4, 'authenticated', 'authenticated')`,
      [owner, `${owner}@example.test`, other, `${other}@example.test`],
    );
    await admin.query(
      `insert into public.profiles (id, display_name) values ($1, 'Owner'), ($2, 'Other')`,
      [owner, other],
    );
  });

  afterAll(async () => {
    await admin.query('delete from auth.users where id = any($1)', [[owner, other]]);
    await admin.end();
  });

  it('returns only the rows of the signed-in user', async () => {
    const rows = await withRls(
      { sub: owner },
      async (tx) => await tx.select({ id: profiles.id }).from(profiles),
    );

    expect(rows).toStrictEqual([{ id: owner }]);
  });

  it('skips updates to rows of another user', async () => {
    const updated = await withRls(
      { sub: owner },
      async (tx) =>
        await tx
          .update(profiles)
          .set({ displayName: 'Hacked' })
          .where(eq(profiles.id, other))
          .returning({ id: profiles.id }),
    );
    const result = await admin.query('select display_name from public.profiles where id = $1', [
      other,
    ]);

    expect(updated).toStrictEqual([]);
    expect(result.rows).toStrictEqual([{ display_name: 'Other' }]);
  });

  it('rejects inserting a row for another user', async () => {
    const failure: unknown = await withRls(
      { sub: owner },
      async (tx) => await tx.insert(profiles).values({ id: crypto.randomUUID() }),
    ).catch((error: unknown) => error);

    expect(getDatabaseErrorCode(failure)).toBe('42501');
  });
});
