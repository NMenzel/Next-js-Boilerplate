import { eq } from 'drizzle-orm';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updateProfile } from '@/actions/ProfileActions';
import { ActionForm } from '@/components/ActionForm';
import { withRls } from '@/libs/DB';
import { requireUserClaims } from '@/libs/Supabase';
import { profiles } from '@/models/Schema';

export default async function AppPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const claims = await requireUserClaims(locale);
  const t = await getTranslations({ locale, namespace: 'AppPage' });
  const fields = await getTranslations({ locale, namespace: 'AuthFields' });

  const [profile] = await withRls(
    claims,
    async (tx) =>
      await tx
        .select({ displayName: profiles.displayName })
        .from(profiles)
        .where(eq(profiles.id, claims.sub)),
  );

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-8 text-base">{t('signed_in_as', { email: claims.email ?? '' })}</p>

      <h2 className="mb-4 text-xl font-bold text-gray-900">{t('profile_heading')}</h2>
      <ActionForm
        action={updateProfile}
        validation="profile"
        submitLabel={t('profile_submit')}
        fields={[
          {
            name: 'display_name',
            label: fields('display_name_label'),
            type: 'text',
            autoComplete: 'nickname',
            error: fields('display_name_error'),
            defaultValue: profile?.displayName ?? '',
            maxLength: 50,
          },
        ]}
      />
    </>
  );
}
