import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import * as z from 'zod';

// Local email testing server started by `npm run db:start` (see `supabase/config.toml`).
const MAILPIT_URL = 'http://127.0.0.1:54324';

const MailpitSearch = z.object({ messages: z.array(z.object({ ID: z.string() })) });
const MailpitMessage = z.object({ HTML: z.string() });

export const PASSWORD = 'correct-horse-battery';

export const createEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

export const signUp = async (page: Page, email: string) => {
  await page.goto('/sign-up');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page).toHaveURL(/\/app$/u);
};

export const signIn = async (page: Page, email: string, password = PASSWORD) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

export const getEmailedLink = async (request: APIRequestContext, to: string) => {
  let messageId = '';

  await expect
    .poll(async () => {
      const response = await request.get(`${MAILPIT_URL}/api/v1/search`, {
        params: { query: `to:"${to}"` },
      });
      const result = MailpitSearch.parse(await response.json());
      messageId = result.messages[0]?.ID ?? '';

      return messageId;
    })
    .not.toBe('');

  const response = await request.get(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  const message = MailpitMessage.parse(await response.json());
  const href = /href="([^"]+)"/u.exec(message.HTML)?.[1] ?? '';

  return href.replaceAll('&amp;', '&');
};

const AUTH_COOKIE = /^sb-.+-auth-token(?:\.\d+)?$/u;
const SESSION_PREFIX = 'base64-';
const StoredSession = z.looseObject({ expires_at: z.number(), refresh_token: z.string() });

// @supabase/ssr stores the session as base64url JSON, split into `.0`, `.1`… chunks when large.
const getAuthCookies = async (context: BrowserContext) => {
  const cookies = await context.cookies();

  return cookies
    .filter((cookie) => AUTH_COOKIE.test(cookie.name))
    .toSorted((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
};

export const readSession = async (context: BrowserContext) => {
  const cookies = await getAuthCookies(context);
  const value = cookies.map((cookie) => cookie.value).join('');
  const json = Buffer.from(value.slice(SESSION_PREFIX.length), 'base64url').toString('utf-8');

  return StoredSession.parse(JSON.parse(json));
};

export const expireAccessToken = async (context: BrowserContext) => {
  const cookies = await getAuthCookies(context);
  const session = await readSession(context);
  const json = JSON.stringify({ ...session, expires_at: session.expires_at - 7200 });
  let encoded = `${SESSION_PREFIX}${Buffer.from(json, 'utf-8').toString('base64url')}`;

  // Keep the original chunk boundaries; the timestamp has the same number of digits.
  await context.addCookies(
    cookies.map((cookie) => {
      const value = encoded.slice(0, cookie.value.length);
      encoded = encoded.slice(cookie.value.length);

      return { ...cookie, value };
    }),
  );
};
