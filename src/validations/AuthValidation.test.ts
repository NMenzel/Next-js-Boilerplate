import { describe, expect, it } from 'vitest';
import { SignInValidation, UpdatePasswordValidation } from './AuthValidation';

describe('AuthValidation', () => {
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
