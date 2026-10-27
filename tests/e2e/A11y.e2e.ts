import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { createEmail, signUp } from './AuthHelpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const getViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
};

test.describe('Accessibility', () => {
  test.describe('Automated WCAG checks', () => {
    for (const path of ['/', '/sign-in', '/sign-up', '/forgot-password', '/es', '/es/sign-up']) {
      test(`finds no violations on ${path}`, async ({ page }) => {
        await page.goto(path);

        expect(await getViolations(page)).toEqual([]);
      });
    }

    test('finds no violations on the signed-in app page', async ({ page }) => {
      await signUp(page, createEmail());

      expect(await getViolations(page)).toEqual([]);
    });
  });

  test.describe('Keyboard and forms', () => {
    test('focuses the skip link first and jumps to the main content', async ({ page }) => {
      await page.goto('/sign-in');
      await page.keyboard.press('Tab');

      await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();

      await page.keyboard.press('Enter');

      await expect(page).toHaveURL(/#main$/u);
    });

    test('links field errors to the invalid input', async ({ page }) => {
      await signUp(page, createEmail());

      const displayName = page.getByLabel('Display name');
      await displayName.fill('   ');
      await page.getByRole('button', { name: 'Save profile' }).click();

      await expect(displayName).toHaveAttribute('aria-invalid', 'true');
      await expect(displayName).toHaveAccessibleDescription('Use 1 to 50 characters.');
    });
  });
});
