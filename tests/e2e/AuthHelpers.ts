import type { APIRequestContext, Page } from '@playwright/test';
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
