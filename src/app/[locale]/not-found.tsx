import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

export default function NotFoundPage() {
  const t = useTranslations('NotFoundPage');

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-6 text-lg">{t('description')}</p>
      <Link href="/" className="text-lg text-blue-700 underline">
        {t('home_link')}
      </Link>
    </main>
  );
}
