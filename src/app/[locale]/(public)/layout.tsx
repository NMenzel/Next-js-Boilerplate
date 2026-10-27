import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Link } from '@/libs/I18nNavigation';
import { BaseTemplate } from '@/templates/BaseTemplate';

export default async function PublicLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PublicLayout' });

  return (
    <BaseTemplate
      leftNav={
        <li>
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            {t('home_link')}
          </Link>
        </li>
      }
      rightNav={
        <>
          <li>
            <Link href="/sign-in" className="text-gray-700 hover:text-gray-900">
              {t('sign_in_link')}
            </Link>
          </li>
          <li>
            <Link href="/sign-up" className="text-gray-700 hover:text-gray-900">
              {t('sign_up_link')}
            </Link>
          </li>
          <li>
            <LocaleSwitcher />
          </li>
        </>
      }
    >
      {props.children}
    </BaseTemplate>
  );
}
