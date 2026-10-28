import * as z from 'zod';

const email = z.string().trim().max(254).pipe(z.email());

// Bcrypt, used by Supabase Auth, ignores bytes after 72. Accented letters and emoji take several
// bytes, so count bytes rather than characters.
const fitsBcrypt = (value: string) => new TextEncoder().encode(value).length <= 72;

const newPassword = z.string().min(8).refine(fitsBcrypt);

export const SignInValidation = z.object({
  email,
  password: z.string().min(1).refine(fitsBcrypt),
});

export const SignUpValidation = z.object({
  email,
  password: newPassword,
});

export const PasswordResetValidation = z.object({
  email,
});

export const UpdatePasswordValidation = z.object({
  password: newPassword,
});

/** Parameters of the confirmation and password recovery links in `supabase/templates/`. */
export const EmailLinkValidation = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(['email', 'recovery']),
});

export const ProfileValidation = z.object({
  display_name: z.string().trim().min(1).max(50),
});

/** Schemas shared by Server Actions and client-side form validation, selected by name. */
export const FormValidations = {
  signIn: SignInValidation,
  signUp: SignUpValidation,
  passwordReset: PasswordResetValidation,
  updatePassword: UpdatePasswordValidation,
  profile: ProfileValidation,
};

export type FormValidationName = keyof typeof FormValidations;
