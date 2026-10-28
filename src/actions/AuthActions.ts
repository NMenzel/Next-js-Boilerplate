'use server';

import type { AuthError } from '@supabase/supabase-js';
import { isAuthRetryableFetchError, isAuthWeakPasswordError } from '@supabase/supabase-js';
import { getLocale, getTranslations } from 'next-intl/server';
import type { FormState } from '@/components/ActionForm';
import { Env } from '@/libs/Env';
import { getPathname, redirect } from '@/libs/I18nNavigation';
import { logger } from '@/libs/Logger';
import { createClient, requireUserClaims } from '@/libs/Supabase';
import { getFormString, getInvalidFields } from '@/utils/Helpers';
import {
  EmailLinkValidation,
  PasswordResetValidation,
  SignInValidation,
  SignUpValidation,
  UpdatePasswordValidation,
} from '@/validations/AuthValidation';

// Email links point to the confirm page, which verifies the token only when the user presses its
// button. See `supabase/templates/`.
const getConfirmUrl = (locale: string) =>
  `${Env.NEXT_PUBLIC_APP_URL}${getPathname({ href: '/auth/confirm', locale })}`;

// Every reason comes from the hosted password policy: the Zod schema already enforces 8 to 72 bytes,
// so `length` means the project requires a longer password.
const getWeakPasswordState = async (
  error: AuthError,
  values?: Record<string, string>,
): Promise<FormState> => {
  const reasons = isAuthWeakPasswordError(error) ? error.reasons : [];
  const t = await getTranslations('Form');

  if (reasons.includes('pwned')) {
    return { status: 'error', message: t('error_password_pwned'), values };
  }

  if (reasons.includes('characters')) {
    return { status: 'error', message: t('error_password_characters'), values };
  }

  return { status: 'error', message: t('error_password_length'), values };
};

// Supabase checks the password before the confirmation status, so `email_not_confirmed` does not
// reveal whether an account exists. Network and server errors are not the user's fault.
const getSignInErrorMessage = async (error: AuthError) => {
  const t = await getTranslations('Form');

  if (error.status === 429) {
    return t('error_rate_limited');
  }

  if (error.code === 'email_not_confirmed') {
    return t('error_email_not_confirmed');
  }

  if (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500) {
    return t('error_generic');
  }

  return t('error_invalid_credentials');
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

    return { status: 'error', message: await getSignInErrorMessage(error), values };
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
    options: { emailRedirectTo: getConfirmUrl(locale) },
  });

  if (error) {
    logger.warn('Sign-up failed', { code: error.code, status: error.status });

    if (error.code === 'weak_password') {
      return await getWeakPasswordState(error, values);
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
    redirectTo: getConfirmUrl(await getLocale()),
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
      return await getWeakPasswordState(error);
    }

    return {
      status: 'error',
      message: error.code === 'same_password' ? t('error_same_password') : t('error_generic'),
    };
  }

  return { status: 'success', message: t('success_password_updated') };
};

/**
 * Verifies a confirmation or password recovery link from the confirm page. The token is only used
 * on this POST, so email scanners that open the link do not consume it, and it works in any browser.
 * @param formData The `token_hash` and `type` parameters of the emailed link.
 * @returns A redirect to the app, the new password form or, for invalid links, sign-in.
 */
export const confirmEmailLink = async (formData: FormData) => {
  const locale = await getLocale();
  const parsed = EmailLinkValidation.safeParse(Object.fromEntries(formData));

  if (parsed.success) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp(parsed.data);

    if (!error) {
      return redirect({
        href: parsed.data.type === 'recovery' ? '/app/update-password' : '/app',
        locale,
      });
    }

    logger.warn('Email link verification failed', { code: error.code, status: error.status });
  }

  return redirect({ href: { pathname: '/sign-in', query: { error: 'link_invalid' } }, locale });
};

export const signOut = async () => {
  const locale = await getLocale();
  const supabase = await createClient();
  // `local` ends only this browser's session; `global` would sign out every device.
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    logger.warn('Sign-out failed', { code: error.code, status: error.status });

    // The session cookies are kept, so do not pretend the user is signed out.
    return redirect({ href: { pathname: '/app', query: { error: 'sign_out_failed' } }, locale });
  }

  return redirect({ href: '/', locale });
};
