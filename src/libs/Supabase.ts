import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Env } from './Env';
import { redirect } from './I18nNavigation';

/**
 * Creates a Supabase client bound to the auth cookies of the current request.
 * Use it in Server Components, Server Actions and Route Handlers; create a new one per request.
 * @returns A typed Supabase server client.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
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
 * Returns the verified JWT claims of the signed-in user.
 * Uses `getClaims()`, which validates the token signature, unlike `getSession()`.
 * @returns The claims, or `null` for anonymous visitors.
 */
const getUserClaims = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims ?? null;
};

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
