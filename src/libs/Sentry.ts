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
};
