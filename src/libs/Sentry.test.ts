import type { ErrorEvent } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';
import { sentryOptions } from './Sentry';

const createEvent = (value: string): ErrorEvent => ({
  type: undefined,
  exception: { values: [{ type: 'DrizzleQueryError', value }] },
});

describe('Sentry options', () => {
  describe('beforeSend', () => {
    it('removes query parameters from failed query messages', () => {
      const event = sentryOptions.beforeSend(
        createEvent(
          'Failed query: select * from "profiles" where "id" = $1\nparams: ada@example.test',
        ),
      );

      expect(event.exception?.values?.[0]?.value).toBe('Failed query (details removed)');
    });

    it('keeps other error messages', () => {
      const event = sentryOptions.beforeSend(createEvent('Network request failed'));

      expect(event.exception?.values?.[0]?.value).toBe('Network request failed');
    });
  });
});
