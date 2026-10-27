import type { MetadataRoute } from 'next';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';
import { getI18nPath } from '@/utils/Helpers';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: routing.locales.map((locale) => getI18nPath('/app', locale)),
    },
    sitemap: `${Env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
