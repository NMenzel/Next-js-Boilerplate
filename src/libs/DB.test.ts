import { describe, expect, it } from 'vitest';
import { getDatabaseErrorCode } from './DB';

const withCode = (code: unknown) => Object.assign(new Error('failed'), { code });

describe(getDatabaseErrorCode, () => {
  it('returns the SQLSTATE of a wrapped Postgres error', () => {
    expect(getDatabaseErrorCode(new Error('Failed query', { cause: withCode('42501') }))).toBe(
      '42501',
    );
  });

  it('returns the code of an unwrapped connection error', () => {
    expect(getDatabaseErrorCode(withCode('ECONNREFUSED'))).toBe('ECONNREFUSED');
  });

  it('returns unknown for errors without a code', () => {
    expect(getDatabaseErrorCode(new Error('failed'))).toBe('unknown');
    expect(getDatabaseErrorCode(withCode(42))).toBe('unknown');
    expect(getDatabaseErrorCode('failed')).toBe('unknown');
  });
});
