import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/libs/I18nNavigation';

type IndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'IndexPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'IndexPage' });

  return (
    <>
      <h1 className="mb-4 text-3xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-6 text-lg">{t('intro')}</p>
      <Link href="/app" className="text-lg text-blue-700 underline">
        {t('app_link')}
      </Link>
    </>
  );
}
