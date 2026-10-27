'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ChangeEventHandler } from 'react';
import { usePathname, useRouter } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

export const LocaleSwitcher = () => {
  const t = useTranslations('LocaleSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const newLocale = event.target.value;

    if (newLocale === locale) {
      return;
    }

    const { search } = window.location;
    router.push(`${pathname}${search}`, { locale: newLocale, scroll: false });
  };

  return (
    <select
      defaultValue={locale}
      onChange={handleChange}
      className="rounded-sm border border-gray-500 px-1 font-medium"
      aria-label={t('change_language')}
    >
      {routing.locales.map((elt) => (
        <option key={elt} value={elt} lang={elt}>
          {new Intl.DisplayNames([elt], { type: 'language' }).of(elt)}
        </option>
      ))}
    </select>
  );
};
