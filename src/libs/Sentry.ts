import type { ErrorEvent } from '@sentry/nextjs';
import { Env } from './Env';

/**
 * Shared, privacy-conservative Sentry options for server, edge and browser.
 * Sentry stays off unless `NEXT_PUBLIC_SENTRY_DSN` is set.
 */
export const sentryOptions = {
  dsn: Env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(Env.NEXT_PUBLIC_SENTRY_DSN),
  tracesSampleRate: 0.1,
  // Auth URLs carry one-time codes and cookies carry sessions; collect neither.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  // Drizzle error messages embed the SQL and its parameters (user input). `withRls()` already
  // replaces them; this is the safety net for privileged queries added outside it.
  beforeSend: (event: ErrorEvent) => {
    for (const exception of event.exception?.values ?? []) {
      if (exception.value?.startsWith('Failed query')) {
        exception.value = 'Failed query (details removed)';
      }
    }

    return event;
  },
};
