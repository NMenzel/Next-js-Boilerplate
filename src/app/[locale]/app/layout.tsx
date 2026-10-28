import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { signOut } from '@/actions/AuthActions';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Link } from '@/libs/I18nNavigation';
import { requireUserClaims } from '@/libs/Supabase';
import { BaseTemplate } from '@/templates/BaseTemplate';

type AppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: AppLayoutProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'AppLayout' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: false, follow: false },
  };
}

export default async function AppLayout(props: AppLayoutProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  await requireUserClaims(locale);
  const t = await getTranslations({ locale, namespace: 'AppLayout' });

  return (
    <BaseTemplate
      leftNav={
        <>
          <li>
            <Link href="/app" className="text-gray-700 hover:text-gray-900">
              {t('app_link')}
            </Link>
          </li>
          <li>
            <Link href="/app/update-password" className="text-gray-700 hover:text-gray-900">
              {t('update_password_link')}
            </Link>
          </li>
        </>
      }
      rightNav={
        <>
          <li>
            <form action={signOut}>
              <button type="submit" className="text-gray-700 hover:text-gray-900">
                {t('sign_out')}
              </button>
            </form>
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
