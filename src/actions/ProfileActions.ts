'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import type { FormState } from '@/components/ActionForm';
import { logger } from '@/libs/Logger';
import { createClient, requireUserClaims } from '@/libs/Supabase';
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
  const supabase = await createClient();

  // RLS only lets users write the row whose id matches their own auth.uid().
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: claims.sub, display_name: parsed.data.display_name });

  if (error) {
    logger.error('Profile update failed', { code: error.code });

    return { status: 'error', message: t('error_generic'), values };
  }

  return {
    status: 'success',
    message: t('success_profile_saved'),
    values: { display_name: parsed.data.display_name },
  };
};
