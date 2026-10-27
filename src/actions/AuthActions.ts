'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import type { FormState } from '@/components/ActionForm';
import { getPathname, redirect } from '@/libs/I18nNavigation';
import { logger } from '@/libs/Logger';
import { createClient, requireUserClaims } from '@/libs/Supabase';
import { getBaseUrl, getFormString, getInvalidFields } from '@/utils/Helpers';
import {
  PasswordResetValidation,
  SignInValidation,
  SignUpValidation,
  UpdatePasswordValidation,
} from '@/validations/AuthValidation';

const getCallbackUrl = (locale: string, next: string) => {
  const path = getPathname({ href: { pathname: '/auth/callback', query: { next } }, locale });

  return `${getBaseUrl()}${path}`;
};

export const signIn = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = SignInValidation.safeParse(Object.fromEntries(formData));
  const values = { email: getFormString(formData, 'email') };

  if (!parsed.success) {
    return { invalidFields: getInvalidFields(parsed.error.issues), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logger.warn('Sign-in failed', { code: error.code, status: error.status });
    const t = await getTranslations('Form');

    return {
      status: 'error',
      message: error.status === 429 ? t('error_rate_limited') : t('error_invalid_credentials'),
      values,
    };
  }

  return redirect({ href: '/app', locale: await getLocale() });
};

export const signUp = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = SignUpValidation.safeParse(Object.fromEntries(formData));
  const values = { email: getFormString(formData, 'email') };

  if (!parsed.success) {
    return { invalidFields: getInvalidFields(parsed.error.issues), values };
  }

  const locale = await getLocale();
  const t = await getTranslations('Form');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: getCallbackUrl(locale, '/app') },
  });

  if (error) {
    logger.warn('Sign-up failed', { code: error.code, status: error.status });

    if (error.code === 'weak_password') {
      return { invalidFields: ['password'], values };
    }

    // Returned when sign-up is disabled in the Supabase Auth settings.
    if (error.code === 'signup_disabled' || error.code === 'email_provider_disabled') {
      return { status: 'error', message: t('error_sign_up_disabled'), values };
    }

    return {
      status: 'error',
      message: error.status === 429 ? t('error_rate_limited') : t('error_generic'),
      values,
    };
  }

  // Without a session, the project requires email confirmation before sign-in.
  if (!data.session) {
    return { status: 'success', message: t('success_check_email') };
  }

  return redirect({ href: '/app', locale });
};

export const requestPasswordReset = async (
  _state: FormState,
  formData: FormData,
): Promise<FormState> => {
  const parsed = PasswordResetValidation.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      invalidFields: getInvalidFields(parsed.error.issues),
      values: { email: getFormString(formData, 'email') },
    };
  }

  const t = await getTranslations('Form');
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getCallbackUrl(await getLocale(), '/app/update-password'),
  });

  if (error) {
    logger.warn('Password reset request failed', { code: error.code, status: error.status });

    if (error.status === 429) {
      return { status: 'error', message: t('error_rate_limited') };
    }
  }

  // Same response whether or not the account exists, to avoid account enumeration.
  return { status: 'success', message: t('success_reset_sent') };
};

export const updatePassword = async (_state: FormState, formData: FormData): Promise<FormState> => {
  const parsed = UpdatePasswordValidation.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { invalidFields: getInvalidFields(parsed.error.issues) };
  }

  await requireUserClaims(await getLocale());

  const t = await getTranslations('Form');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    logger.warn('Password update failed', { code: error.code, status: error.status });

    if (error.code === 'weak_password') {
      return { invalidFields: ['password'] };
    }

    return {
      status: 'error',
      message: error.code === 'same_password' ? t('error_same_password') : t('error_generic'),
    };
  }

  return { status: 'success', message: t('success_password_updated') };
};

export const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return redirect({ href: '/', locale: await getLocale() });
};
