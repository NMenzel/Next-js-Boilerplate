'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import type { FormState } from '@/components/ActionForm';
import { getDatabaseErrorCode, withRls } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { requireUserClaims } from '@/libs/Supabase';
import { profiles } from '@/models/Schema';
import { getFormString, getInvalidFields } from '@/utils/Helpers';
import { ProfileValidation } from '@/validations/AuthValidation';

export const updateProfile = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = ProfileValidation.safeParse(Object.fromEntries(formData));
  const values = { display_name: getFormString(formData, 'display_name') };

  if (!parsed.success) {
    return { invalidFields: getInvalidFields(parsed.error.issues), values };
  }

  const claims = await requireUserClaims(await getLocale());
  const t = await getTranslations('Form');
  const displayName = parsed.data.display_name;

  // RLS only lets users write the row whose id matches their own auth.uid().
  const saved = await withRls(claims, async (tx) => {
    await tx
      .insert(profiles)
      .values({ id: claims.sub, displayName })
      .onConflictDoUpdate({ target: profiles.id, set: { displayName } });
  }).then(
    () => true,
    (error: unknown) => {
      logger.error('Profile update failed', { code: getDatabaseErrorCode(error) });

      return false;
    },
  );

  if (!saved) {
    return { status: 'error', message: t('error_generic'), values };
  }

  return {
    status: 'success',
    message: t('success_profile_saved'),
    values: { display_name: displayName },
  };
};
