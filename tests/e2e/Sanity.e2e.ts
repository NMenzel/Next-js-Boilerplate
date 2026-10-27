import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('displays the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { name: 'Next.js starter' })).toBeVisible();
    });
  });
});
