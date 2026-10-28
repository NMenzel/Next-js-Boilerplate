'use client';

import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/libs/I18nNavigation';

// Errors below the locale layout render here, localized; `global-error.tsx` only handles failures of
// the layout itself.
export default function ErrorPage(props: { error: unknown }) {
  const t = useTranslations('ErrorPage');

  useEffect(() => {
    Sentry.captureException(props.error);
  }, [props.error]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      {/* Error files ignore `generateMetadata`; React hoists this into <head>. */}
      <title>{t('heading')}</title>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-6 text-lg">{t('description')}</p>
      <Link href="/" className="text-lg text-blue-700 underline">
        {t('home_link')}
      </Link>
    </main>
  );
}
