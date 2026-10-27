import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'Next.js starter' })).toBeVisible();
    });
  });

  test.describe('Security defaults', () => {
    test('sends baseline security headers', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers() ?? {};

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(headers['x-powered-by']).toBeUndefined();
    });

    test('runs without Sentry requests when no DSN is configured', async ({ page }) => {
      const sentryRequests: string[] = [];
      page.on('request', (request) => {
        if (/sentry/iu.test(request.url())) {
          sentryRequests.push(request.url());
        }
      });

      await page.goto('/');
      await page.getByRole('link', { name: 'Sign in', exact: true }).click();

      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      expect(sentryRequests).toEqual([]);
    });
  });
});
