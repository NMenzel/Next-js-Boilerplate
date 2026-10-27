import { describe, expect, it, vi } from 'vitest';
import { logger } from './Logger';

describe('Logger', () => {
  it('removes sensitive properties before writing to the console', () => {
    const write = vi.spyOn(console, 'warn').mockReturnValue();

    logger.warn('Sign-in failed', {
      code: 'invalid_credentials',
      email: 'person@example.test',
      access_token: 'token-value',
      password: 'password-value',
    });

    const output = String(write.mock.calls.at(-1)?.[0]);
    write.mockRestore();

    expect(output).toContain('invalid_credentials');
    expect(output).not.toContain('person@example.test');
    expect(output).not.toContain('token-value');
    expect(output).not.toContain('password-value');
  });
});
