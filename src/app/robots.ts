import type { MetadataRoute } from 'next';
import { Env } from '@/libs/Env';
import { getPathname } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: routing.locales.map((locale) => getPathname({ href: '/app', locale })),
    },
    sitemap: `${Env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
