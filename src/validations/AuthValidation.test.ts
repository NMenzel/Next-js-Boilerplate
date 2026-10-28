import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EmailLinkValidation, SignInValidation, UpdatePasswordValidation } from './AuthValidation';

// Fills the Supabase template variables the way Auth does: `RedirectTo` is the confirm page URL
// passed by the Server Action.
const getTemplateLink = (template: string) => {
  const html = readFileSync(
    new URL(`../../supabase/templates/${template}`, import.meta.url),
    'utf-8',
  );
  const href = /href="([^"]+)"/u.exec(html)?.[1] ?? '';

  return new URL(
    href
      .replace('{{ .RedirectTo }}', 'http://localhost:3000/es/auth/confirm')
      .replace('{{ .TokenHash }}', 'token-hash')
      .replaceAll('&amp;', '&'),
  );
};

describe('AuthValidation', () => {
  describe('Email link templates', () => {
    it.each([
      ['confirmation.html', 'email'],
      ['recovery.html', 'recovery'],
    ])('opens the confirm page with valid parameters from %s', (template, type) => {
      const link = getTemplateLink(template);

      expect(link.pathname).toBe('/es/auth/confirm');
      expect(EmailLinkValidation.parse(Object.fromEntries(link.searchParams))).toStrictEqual({
        token_hash: 'token-hash',
        type,
      });
    });
  });

  describe('New password', () => {
    it('accepts 72 single-byte characters', () => {
      expect(UpdatePasswordValidation.safeParse({ password: 'a'.repeat(72) }).success).toBeTruthy();
    });

    it('rejects passwords longer than 72 bytes', () => {
      // 40 characters, 80 bytes in UTF-8.
      expect(UpdatePasswordValidation.safeParse({ password: 'é'.repeat(40) }).success).toBeFalsy();
    });

    it('rejects passwords shorter than 8 characters', () => {
      expect(UpdatePasswordValidation.safeParse({ password: 'short' }).success).toBeFalsy();
    });
  });

  describe('Sign-in password', () => {
    it('rejects passwords longer than 72 bytes', () => {
      expect(
        SignInValidation.safeParse({ email: 'ada@example.test', password: '😀'.repeat(19) })
          .success,
      ).toBeFalsy();
    });
  });
});
