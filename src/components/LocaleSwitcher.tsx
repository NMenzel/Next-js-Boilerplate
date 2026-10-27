'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

// Links instead of an auto-navigating <select>: changing a select must not change context (WCAG 3.2.2).
export const LocaleSwitcher = () => {
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
              href={pathname}
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
