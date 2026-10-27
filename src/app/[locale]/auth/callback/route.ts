import { hasLocale } from 'next-intl';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPathname } from '@/libs/I18nNavigation';
import { routing } from '@/libs/I18nRouting';
import { logger } from '@/libs/Logger';
import { createClient } from '@/libs/Supabase';
import { getSafeRedirectPath } from '@/utils/Helpers';

/**
 * Completes email links (sign-up confirmation, password recovery) by exchanging the PKCE code
 * for a session, then redirects to a validated same-site path.
 * @param request The incoming request with `code` and optional `next` query parameters.
 * @param props The route context.
 * @param props.params The dynamic route parameters.
 * @returns A redirect response.
 */
export const GET = async (request: NextRequest, props: { params: Promise<{ locale: string }> }) => {
  const { locale: requestedLocale } = await props.params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const code = request.nextUrl.searchParams.get('code');
  const next = getSafeRedirectPath(request.nextUrl.searchParams.get('next'), '/app');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(getPathname({ href: next, locale }), request.url));
    }

    logger.warn('Auth code exchange failed', { code: error.code, status: error.status });
  }

  const signInPath = getPathname({
    href: { pathname: '/sign-in', query: { error: 'link_invalid' } },
    locale,
  });

  return NextResponse.redirect(new URL(signInPath, request.url));
};
