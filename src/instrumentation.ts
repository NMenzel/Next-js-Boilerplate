import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from '@/libs/Sentry';

export function register() {
  if (sentryOptions.enabled) {
    Sentry.init(sentryOptions);
  }
}

export const onRequestError = Sentry.captureRequestError;
