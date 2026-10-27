import { expect, test } from '@playwright/test';
import {
  createEmail,
  expireAccessToken,
  getEmailedLink,
  PASSWORD,
  readSession,
  signIn,
  signUp,
} from './AuthHelpers';

// Requires the local Supabase stack: `npm run db:start`.
test.describe('Authentication', () => {
  test.describe('Protected route', () => {
    test('redirects anonymous visitors to sign-in', async ({ page }) => {
      await page.goto('/app');

      await expect(page).toHaveURL(/\/sign-in$/u);
    });

    test('redirects anonymous visitors to the Spanish sign-in page', async ({ page }) => {
      await page.goto('/es/app');

      await expect(page).toHaveURL(/\/es\/sign-in$/u);
      await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    });
  });

  test.describe('Email and password', () => {
    test('signs up, signs out and signs back in', async ({ page }) => {
      const email = createEmail();
      await signUp(page, email);

      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

      await page.getByRole('button', { name: 'Sign out' }).click();

      await expect(page.getByRole('heading', { name: 'Next.js starter' })).toBeVisible();

      await page.goto('/app');

      await expect(page).toHaveURL(/\/sign-in$/u);

      await signIn(page, email);

      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    });

    test('rejects a wrong password with a generic message', async ({ page }) => {
      const email = createEmail();
      await signUp(page, email);
      await page.context().clearCookies();

      await signIn(page, email, 'wrong-password');

      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        'Invalid email or password.',
      );
      await expect(page.getByLabel('Email')).toHaveValue(email);
      await expect(page).toHaveURL(/\/sign-in$/u);
    });

    test('keeps the session across locale switches and reloads', async ({ page }) => {
      const email = createEmail();
      await signUp(page, email);

      await page.getByRole('link', { name: 'Español' }).click();

      await expect(page).toHaveURL(/\/es\/app$/u);
      await expect(page.getByText(`Has iniciado sesión como ${email}`)).toBeVisible();

      await page.reload();

      await expect(page.getByText(`Has iniciado sesión como ${email}`)).toBeVisible();
    });
  });

  test.describe('Session refresh', () => {
    test('refreshes an expired access token in the proxy without signing out', async ({
      context,
      page,
    }) => {
      const email = createEmail();
      await signUp(page, email);
      const before = await readSession(context);
      await expireAccessToken(context);

      await page.goto('/app');

      await expect(page).toHaveURL(/\/app$/u);
      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();

      const after = await readSession(context);

      expect(after.refresh_token).not.toBe(before.refresh_token);
      expect(after.expires_at).toBeGreaterThan(Date.now() / 1000);
    });
  });

  test.describe('Profile', () => {
    test('saves the display name of the signed-in user', async ({ page }) => {
      await signUp(page, createEmail());

      await page.getByLabel('Display name').fill('Ada');
      await page.getByRole('button', { name: 'Save profile' }).click();

      await expect(page.getByRole('main').getByRole('status')).toHaveText('Profile saved.');

      await page.reload();

      await expect(page.getByLabel('Display name')).toHaveValue('Ada');
    });
  });

  test.describe('Password recovery', () => {
    test('resets the password from the emailed link', async ({ page, request }) => {
      const email = createEmail();
      const newPassword = `${PASSWORD}-new`;
      await signUp(page, email);
      await page.context().clearCookies();

      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(email);
      await page.getByRole('button', { name: 'Send reset link' }).click();

      await expect(page.getByRole('main').getByRole('status')).toContainText(
        'reset link is on its way',
      );

      await page.goto(await getEmailedLink(request, email));

      await expect(page).toHaveURL(/\/app\/update-password$/u);

      await page.getByLabel('New password').fill(newPassword);
      await page.getByRole('button', { name: 'Update password' }).click();

      await expect(page.getByRole('main').getByRole('status')).toHaveText('Password updated.');

      await page.context().clearCookies();
      await signIn(page, email, newPassword);

      await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    });
  });

  test.describe('Auth callback', () => {
    test('sends invalid links to sign-in and ignores off-site targets', async ({ page }) => {
      await page.goto('/auth/callback?code=invalid&next=//evil.example');

      await expect(page).toHaveURL(/\/sign-in\?error=link_invalid$/u);
      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        'The link is invalid or has expired.',
      );
    });
  });
});
