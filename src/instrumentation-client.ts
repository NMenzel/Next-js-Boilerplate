// oxlint-disable import/namespace
import * as Sentry from '@sentry/nextjs';
import { installTranslationResilience } from 'translation-resilience';
import { sentryOptions } from '@/libs/Sentry';

// Install the DOM shim before React renders because browser translators replace React-owned
// text nodes, which can cause crashes and frozen updates.
installTranslationResilience();

// No Session Replay: recording user sessions needs a product-level privacy and consent decision.
if (sentryOptions.enabled) {
  Sentry.init({ ...sentryOptions, integrations: [Sentry.browserTracingIntegration()] });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
