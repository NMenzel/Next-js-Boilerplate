'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { routing } from '@/libs/I18nRouting';
import messages from '@/locales/en.json';

// Replaces the locale layout when that layout fails, so no locale or translation provider exists:
// render the default locale's messages. Other errors use the localized `[locale]/error.tsx`.
export default function GlobalError(props: { error: unknown }) {
  useEffect(() => {
    Sentry.captureException(props.error);
  }, [props.error]);

  return (
    <html lang={routing.defaultLocale}>
      <body>
        <main>
          <title>{messages.ErrorPage.heading}</title>
          <h1>{messages.ErrorPage.heading}</h1>
          <p>{messages.ErrorPage.description}</p>
          {/* A full page load: the client router may be broken. */}
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages */}
          <a href="/">{messages.ErrorPage.home_link}</a>
        </main>
      </body>
    </html>
  );
}
