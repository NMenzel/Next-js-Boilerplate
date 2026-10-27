import * as z from 'zod';

const email = z.string().trim().max(254).pipe(z.email());

// Bcrypt, used by Supabase Auth, ignores bytes after 72.
const newPassword = z.string().min(8).max(72);

export const SignInValidation = z.object({
  email,
  password: z.string().min(1).max(72),
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

export const ProfileValidation = z.object({
  display_name: z.string().trim().min(1).max(50),
});
