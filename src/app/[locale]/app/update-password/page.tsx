import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updatePassword } from '@/actions/AuthActions';
import { ActionForm } from '@/components/ActionForm';
import { requireUserClaims } from '@/libs/Supabase';

export default async function UpdatePasswordPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  await requireUserClaims(locale);
  const t = await getTranslations({ locale, namespace: 'UpdatePasswordPage' });
  const fields = await getTranslations({ locale, namespace: 'AuthFields' });

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <ActionForm
        action={updatePassword}
        submitLabel={t('submit')}
        fields={[
          {
            name: 'password',
            label: fields('new_password_label'),
            type: 'password',
            autoComplete: 'new-password',
            hint: fields('new_password_hint'),
            error: fields('new_password_error'),
            minLength: 8,
            maxLength: 72,
          },
        ]}
      />
    </>
  );
}
