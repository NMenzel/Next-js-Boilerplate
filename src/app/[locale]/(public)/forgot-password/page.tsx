import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requestPasswordReset } from '@/actions/AuthActions';
import { ActionForm } from '@/components/ActionForm';
import { Link } from '@/libs/I18nNavigation';

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ForgotPasswordPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function ForgotPasswordPage(props: ForgotPasswordPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ForgotPasswordPage' });
  const fields = await getTranslations({ locale, namespace: 'AuthFields' });

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-6 text-base">{t('intro')}</p>
      <ActionForm
        action={requestPasswordReset}
        validation="passwordReset"
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
