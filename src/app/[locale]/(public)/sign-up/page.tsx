import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { signUp } from '@/actions/AuthActions';
import { ActionForm } from '@/components/ActionForm';
import { Link } from '@/libs/I18nNavigation';

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: SignUpPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SignUpPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignUpPage(props: SignUpPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SignUpPage' });
  const fields = await getTranslations({ locale, namespace: 'AuthFields' });

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <ActionForm
        action={signUp}
        validation="signUp"
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
            autoComplete: 'new-password',
            hint: fields('new_password_hint'),
            error: fields('new_password_error'),
            minLength: 8,
            maxLength: 72,
          },
        ]}
      />
      <p className="mt-6 text-base">
        <Link href="/sign-in" className="text-blue-700 underline">
          {t('sign_in_link')}
        </Link>
      </p>
    </>
  );
}
