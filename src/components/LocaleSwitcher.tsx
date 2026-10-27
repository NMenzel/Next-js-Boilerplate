'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

// Links instead of an auto-navigating <select>: changing a select must not change context (WCAG 3.2.2).
// Changing locale adds the locale prefix (also `/en`), so the proxy updates the locale cookie even
// without JavaScript.
const LocaleLinks = (props: { query?: Record<string, string> }) => {
  const t = useTranslations('LocaleSwitcher');
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <ul aria-label={t('change_language')} className="flex gap-x-3">
      {routing.locales.map((elt) => {
        const name = new Intl.DisplayNames([elt], { type: 'language' }).of(elt) ?? elt;

        return (
          <li key={elt}>
            <Link
              href={{ pathname, query: props.query }}
              locale={elt}
              lang={elt}
              hrefLang={elt}
              aria-current={elt === locale ? 'true' : undefined}
              className="text-gray-700 hover:text-gray-900 aria-[current]:font-bold aria-[current]:text-gray-900"
            >
              {name.charAt(0).toLocaleUpperCase(elt) + name.slice(1)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const LocaleLinksWithQuery = () => {
  const searchParams = useSearchParams();

  return (
    <LocaleLinks query={searchParams.size > 0 ? Object.fromEntries(searchParams) : undefined} />
  );
};

// Static pages cannot read the query while prerendering, so they render the links without it and
// add it on the client. Dynamic pages render it on the server.
export const LocaleSwitcher = () => (
  <Suspense fallback={<LocaleLinks />}>
    <LocaleLinksWithQuery />
  </Suspense>
);
