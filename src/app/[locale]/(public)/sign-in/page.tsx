import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { signIn } from '@/actions/AuthActions';
import { ActionForm } from '@/components/ActionForm';
import { Link } from '@/libs/I18nNavigation';

type SignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata(props: SignInPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SignInPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: SignInPageProps) {
  const { locale } = await props.params;
  const { error } = await props.searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SignInPage' });
  const fields = await getTranslations({ locale, namespace: 'AuthFields' });
  const form = await getTranslations({ locale, namespace: 'Form' });

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <ActionForm
        action={signIn}
        initialState={
          error === 'link_invalid'
            ? { status: 'error', message: form('error_link_invalid') }
            : undefined
        }
        submitLabel={t('submit')}
        fields={[
          {
            name: 'email',
            label: fields('email_label'),
            type: 'email',
            autoComplete: 'email',
            error: fields('email_error'),
            maxLength: 254,
          },
          {
            name: 'password',
            label: fields('password_label'),
            type: 'password',
            autoComplete: 'current-password',
            error: fields('password_required_error'),
            maxLength: 72,
          },
        ]}
      />
      <ul className="mt-6 flex flex-col gap-2 text-base">
        <li>
          <Link href="/forgot-password" className="text-blue-700 underline">
            {t('forgot_password_link')}
          </Link>
        </li>
        <li>
          <Link href="/sign-up" className="text-blue-700 underline">
            {t('sign_up_link')}
          </Link>
        </li>
      </ul>
    </>
  );
}
