import { describe, expect, it } from 'vitest';
import { routing } from '@/libs/I18nRouting';
import { getI18nPath, getSafeRedirectPath } from './Helpers';

describe('Helpers', () => {
  describe('I18n path helper', () => {
    it('keeps path unchanged when locale is default', () => {
      const url = '/random-url';
      const locale = routing.defaultLocale;

      expect(getI18nPath(url, locale)).toBe(url);
    });

    it('prefixes path with locale when locale is not default', () => {
      const url = '/random-url';
      const locale = 'es';

      expect(getI18nPath(url, locale)).toBe(`/es${url}`);
    });
  });

  describe('Safe redirect path', () => {
    it('keeps same-origin paths with query and hash', () => {
      expect(getSafeRedirectPath('/app/update-password?x=1#top', '/app')).toBe(
        '/app/update-password?x=1#top',
      );
    });

    it('falls back when path is missing', () => {
      expect(getSafeRedirectPath(null, '/app')).toBe('/app');
      expect(getSafeRedirectPath('', '/app')).toBe('/app');
    });

    it.each([
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/\t/evil.example',
      '/\n/evil.example',
      // oxlint-disable-next-line no-script-url -- deliberate malicious input
      'javascript:alert(1)',
      'app',
    ])('rejects off-site target %j', (path) => {
      expect(getSafeRedirectPath(path, '/app')).toBe('/app');
    });
  });
});
