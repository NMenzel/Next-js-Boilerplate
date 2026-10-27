import type { SetAllCookies } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { Env } from './libs/Env';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  let refreshedCookies: Parameters<SetAllCookies>[0] = [];
  let cacheHeaders: Parameters<SetAllCookies>[1] = {};

  const supabase = createServerClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          refreshedCookies = cookiesToSet;
          cacheHeaders = headers;
        },
      },
    },
  );

  // Refreshes an expired session. Keep this call directly after creating the client.
  // Authorization happens in pages, actions and RLS, not here.
  await supabase.auth.getClaims();

  // next-intl forwards the request headers, so Server Components see the refreshed cookies.
  const response = handleI18nRouting(request);

  for (const { name, value, options } of refreshedCookies) {
    response.cookies.set(name, value, options);
  }

  // Prevents CDNs from caching responses that carry session cookies.
  for (const [key, value] of Object.entries(cacheHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `/api`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|api|.*\\..*).*)',
};
