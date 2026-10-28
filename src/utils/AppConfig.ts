import type { LocalePrefixMode } from 'next-intl/routing';

/** Locale prefix strategy for next-intl routing. */
const localePrefix: LocalePrefixMode = 'as-needed';

/** Centralized application configuration. Rename the app here. */
export const AppConfig = {
  name: 'Next.js Starter',
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    localePrefix,
  },
};
