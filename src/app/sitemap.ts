import type { MetadataRoute } from 'next';
import { Env } from '@/libs/Env';
import { getPathname } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

const getHomeUrl = (locale: string) =>
  `${Env.NEXT_PUBLIC_APP_URL}${getPathname({ href: '/', locale })}`;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getHomeUrl(routing.defaultLocale),
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales
            .filter((locale) => locale !== routing.defaultLocale)
            .map((locale) => [locale, getHomeUrl(locale)]),
        ),
      },
    },
  ];
}
