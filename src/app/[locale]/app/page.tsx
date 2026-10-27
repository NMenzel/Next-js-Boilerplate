import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updateProfile } from '@/actions/ProfileActions';
import { ActionForm } from '@/components/ActionForm';
import { createClient, requireUserClaims } from '@/libs/Supabase';

export default async function AppPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const claims = await requireUserClaims(locale);
  const t = await getTranslations({ locale, namespace: 'AppPage' });
  const fields = await getTranslations({ locale, namespace: 'AuthFields' });

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', claims.sub)
    .maybeSingle();

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-8 text-base">{t('signed_in_as', { email: claims.email ?? '' })}</p>

      <h2 className="mb-4 text-xl font-bold text-gray-900">{t('profile_heading')}</h2>
      <ActionForm
        action={updateProfile}
        submitLabel={t('profile_submit')}
        fields={[
          {
            name: 'display_name',
            label: fields('display_name_label'),
            type: 'text',
            autoComplete: 'nickname',
            error: fields('display_name_error'),
            defaultValue: profile?.display_name ?? '',
            maxLength: 50,
          },
        ]}
      />
    </>
  );
}
