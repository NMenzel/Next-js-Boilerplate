import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language switching', () => {
    test('switches the homepage from English to Spanish with the language links', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'Next.js starter' })).toBeVisible();

      await page.getByRole('link', { name: 'Español' }).click();

      await expect(page).toHaveURL(/\/es$/u);
      await expect(page.getByRole('heading', { name: 'Starter de Next.js' })).toBeVisible();
    });

    test('renders the Spanish sign-in form from the URL', async ({ page }) => {
      await page.goto('/es/sign-in');

      await expect(page.getByLabel('Correo electrónico')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
    });

    test('sets the document language for each locale', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('html')).toHaveAttribute('lang', 'en');

      await page.goto('/es');

      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    });

    test('renders a localized not-found page with a 404 status', async ({ page }) => {
      const response = await page.goto('/es/missing-page');

      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
    });

    test('keeps the query string when switching language', async ({ page }) => {
      await page.goto('/sign-in?error=link_invalid');
      await page.getByRole('link', { name: 'Español' }).click();

      await expect(page).toHaveURL(/\/es\/sign-in\?error=link_invalid$/u);
      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        'El enlace no es válido o ha caducado.',
      );
    });
  });

  test.describe('Without JavaScript', () => {
    test.use({ javaScriptEnabled: false, locale: 'es-ES' });

    test('switches from Spanish back to English and remembers the choice', async ({ page }) => {
      await page.goto('/es/sign-in?error=link_invalid');
      await page.getByRole('link', { name: 'English' }).click();

      await expect(page).toHaveURL(/\/sign-in\?error=link_invalid$/u);
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'Next.js starter' })).toBeVisible();
    });
  });
});
