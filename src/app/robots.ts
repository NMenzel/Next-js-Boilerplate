import type { MetadataRoute } from 'next';
import { routing } from '@/libs/I18nRouting';
import { getBaseUrl, getI18nPath } from '@/utils/Helpers';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: routing.locales.map((locale) => getI18nPath('/app', locale)),
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
