import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { Env } from './Env';
import { redirect } from './I18nNavigation';
import { supabaseCookieOptions } from './SupabaseCookies';

/**
 * Creates a Supabase client bound to the auth cookies of the current request.
 * Use it in Server Components and Server Actions; create a new one per request. A Route Handler
 * that signs users in must also send `Cache-Control: private, no-store`.
 * @returns A typed Supabase server client.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll: () => cookieStore.getAll(),
        // The cache headers (second argument) cannot be set here. Cookies are only written by Server
        // Actions, whose POST responses shared caches do not store; `proxy.ts` adds the headers to
        // GET responses that refresh the session.
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies; `proxy.ts` refreshes the session instead.
          }
        },
      },
    },
  );
};

/**
 * Returns the verified JWT claims of the signed-in user, once per request (layouts and pages share it).
 * Uses `getClaims()`, which validates the token signature, unlike `getSession()`.
 * @returns The claims, or `null` for anonymous visitors.
 */
const getUserClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims ?? null;
});

/**
 * Returns the verified claims of the signed-in user, or redirects anonymous visitors to sign-in.
 * Call it in every protected page and Server Action; layouts alone do not protect data.
 * @param locale The active locale, used for the sign-in redirect.
 * @returns The JWT claims of the signed-in user.
 */
export const requireUserClaims = async (locale: string) => {
  const claims = await getUserClaims();

  if (!claims) {
    return redirect({ href: '/sign-in', locale });
  }

  return claims;
};
