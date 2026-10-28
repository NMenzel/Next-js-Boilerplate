# Code review: starter cleanup branch

- **Date:** 2026-10-27
- **Scope:** `chore/reusable-starter-cleanup` at `58d39a2`, compared with the upstream base `b83157a`
- **Method:** automated review (`/code-review`), then manual reproduction of the highest-risk findings
- **Result:** 14 findings fixed and 1 disproved (now covered by a test). Each fix has a covering test, except item 12, which needs a hosted password policy; tests for items 7, 8, 9, 11, 13 and 15 were shown to fail without the fix.

## Findings

| # | Severity | Area | Finding | Evidence | Status |
|---|---|---|---|---|---|
| 1 | High | Security | `getSafeRedirectPath` can be bypassed with dot segments: `/..//evil.example`, `/.//x`, `/%2e%2e//x` and `/a/..//x` resolve to the protocol-relative path `//evil.example`, so `/auth/callback?next=/..//evil.example` redirects a freshly signed-in user off-site (`src/utils/Helpers.ts:50`) | Reproduced: `URL.parse('/..//evil.example', 'http://localhost').pathname === '//evil.example'` | Fixed `068ff33` |
| 2 | High | Privacy | With a Sentry DSN set, `onRequestError` sends unhandled Drizzle errors with their full message, which embeds query parameters. Nothing scrubs it (`src/instrumentation.ts:10`, `src/libs/Sentry.ts`) | `databaseQueryData: false` covers spans only, not exception messages | Fixed `3729d71` |
| 3 | Medium | Security | `createClient`'s `setAll` drops the cache headers (`Cache-Control`, `Expires`, `Pragma`), so the auth callback sends `Set-Cookie` on a redirect without `no-store` (`src/libs/Supabase.ts:20`) | Confirmed by reading the code | Fixed `068ff33` |
| 4 | Medium | Security | The auth callback reads `code` and `next` without Zod, contrary to `AGENTS.md` (`src/app/[locale]/auth/callback/route.ts:23`) | Confirmed by reading the code | Fixed `068ff33` |
| 5 | Medium | Auth | Email links use the PKCE code exchange, which needs the code-verifier cookie of the requesting browser. Links opened in another browser or device always fail, and email scanners that pre-fetch links consume them (`auth/callback/route.ts:28`) | Supabase recommends `token_hash` + `verifyOtp` with custom email templates | Fixed `068ff33` |
| 6 | Medium | Auth | `NEXT_PUBLIC_APP_URL` is optional and falls back to `http://localhost:3000`, so production email links can point to localhost (`src/libs/Env.ts:14`) | Confirmed by reading the code | Fixed `068ff33` |
| 7 | Medium | Auth | `signOut()` uses the default `global` scope (signs out every device) and ignores the returned error, then redirects as if it succeeded (`src/actions/AuthActions.ts:152`) | Confirmed by reading the code | Fixed `068ff33` |
| 8 | Low | Forms | `defaultValue={state.values?.[name]}` is overwritten by React Hook Form's `register`, which uses `useForm` defaults that ignore `state.values`. A form posted before hydration loses the returned values on hydration (`src/components/ActionForm.tsx:105`) | Reproduced by a new component test (the input showed the old value) | Fixed `d12b26b` |
| 9 | Low | i18n | The language links drop the query string, e.g. `?error=link_invalid` (`src/components/LocaleSwitcher.tsx:21`) | Confirmed by reading the code | Fixed `d12b26b` |
| 10 | Low | i18n | Without JavaScript, switching from Spanish back to English may be impossible because the `NEXT_LOCALE` cookie is only synced in the link's click handler (`src/components/LocaleSwitcher.tsx:18`) | Disproved: the English link is `/en/sign-in?…`; the proxy answers it with `Set-Cookie: NEXT_LOCALE=en` and a redirect to `/sign-in?…` (checked with curl). An unprefixed link would indeed bounce back to `/es` | Not a bug; now tested `d12b26b` |
| 11 | Low | Forms | The 72-character password limit counts UTF-16 code units, but bcrypt's limit is 72 bytes. Passwords with accents or emoji can pass validation and then fail at Supabase Auth (`src/validations/AuthValidation.ts:6`) | Confirmed by reading the code | Fixed `068ff33` |
| 12 | Low | Auth | Every `weak_password` error shows "Use 8 to 72 characters", even for leaked-password or character-set rules (`src/actions/AuthActions.ts:66`, `:137`) | Confirmed by reading the code | Fixed `068ff33` |
| 13 | Low | Logging | `getDatabaseErrorCode` reads only `error.cause.code`, so connection errors (`ECONNREFUSED`) are logged as `unknown` (`src/libs/DB.ts:40`) | Confirmed by reading the code | Fixed `3729d71` |
| 14 | Low | Performance | `getUserClaims` is not deduplicated per request; the `/app` layout and page each verify the JWT (`src/libs/Supabase.ts:39`) | Confirmed by reading the code | Fixed `068ff33` |
| 15 | Low | Accessibility | `/app/update-password` and the localized 404 page have no axe check, contrary to `AGENTS.md` (`tests/e2e/A11y.e2e.ts:16`) | Confirmed by reading the test | Fixed `20d7664` |

## Fixes

| # | Change | Test that covers it |
|---|---|---|
| 1, 4, 5 | Email links now open `/[locale]/auth/confirm?token_hash=…&type=…` (templates in `supabase/templates/`, wired in `supabase/config.toml`). The page validates the parameters with `EmailLinkValidation` (Zod) and only renders a "Continue" button; the `confirmEmailLink` Server Action calls `verifyOtp`. The destination depends only on `type`, so the `next` parameter, the PKCE callback route and `getSafeRedirectPath` (its only consumer) were removed. `AGENTS.md` now forbids redirects to user-supplied targets | E2E: reset link opened in a second browser context after a scanner-style GET; links with missing parameters; invalid token with `next=//evil.example` stays on the app origin |
| 3 | Session cookies are now written only by Server Action POST responses, which shared caches do not store; the `Supabase.ts` comment explains why `setAll` ignores the header argument | E2E: the POST that verifies the reset link answers with `Cache-Control: … no-store` |
| 2 | `sentryOptions.beforeSend` replaces Drizzle "Failed query" messages | `Sentry.test.ts` |
| 6 | `NEXT_PUBLIC_APP_URL` is required (`Env.ts`, `.env.example`); `getBaseUrl()` and its localhost fallback were removed | Build and E2E use the validated value |
| 7 | `signOut({ scope: 'local' })`; on failure the user stays on `/app` with "Sign-out failed. You are still signed in." | E2E: signing out in one browser keeps the other signed in, even after a forced token refresh. Mutation: `scope: 'global'` fails it |
| 8 | `useForm` defaults include `state.values` | `ActionForm.test.tsx` (failed before the fix) |
| 9 | `LocaleSwitcher` adds the query string (`useSearchParams` inside `Suspense`; static pages render the links without it, then add it on the client) | Story `KeepsQuery` (failed before the fix); E2E query test |
| 10 | No change needed; comment added to `LocaleSwitcher` | E2E without JavaScript: Spanish → English keeps English on `/` |
| 11 | Passwords are checked for at most 72 UTF-8 bytes; the error explains that accents and emoji count as more | `AuthValidation.test.ts` (failed before the fix) |
| 12 | `weak_password` with reason `pwned` or `characters` shows its own message | Not testable locally (needs a hosted password policy) |
| 13 | `getDatabaseErrorCode` falls back to the top-level `code` | `DB.test.ts` (failed before the fix) |
| 14 | `getUserClaims` is wrapped in React `cache()` | Existing auth E2E tests |
| 15 | axe now covers `/app/update-password`, the confirm page and the 404 page (en/es). This found a real violation: the 404 page had no `<title>`; it now renders one | `A11y.e2e.ts` (failed before the fix) |

Verification after the fixes (working copy at `0f33cc8`): `npm run verify` passes (static checks, 16 unit/component tests, 6 story tests, 15 pgTAP assertions, 3 Drizzle RLS tests, 33 E2E tests); `CI=true npm run test:e2e` 66/66 (Chromium + Firefox); `npm run build-storybook` passes.

Hosted projects must copy the two email templates to *Authentication → Emails*; with the default templates, email links are rejected as invalid. This is in the README, `docs/architecture.md` and ADR-005.

## Second review (2026-10-27, branch at `c960924`)

Scope: the full branch (`b83157a..c960924`) including the fixes above, plus config, CI, migrations, tests and docs. Fixes 1 and 3–15 hold. Fix 2 is incomplete (finding 16). The `no-store` assertion cited for fix 3 tests Next.js, not app code (finding 26).

| # | Severity | Area | Finding | Evidence | Status |
|---|---|---|---|---|---|
| 16 | High | Privacy | Drizzle errors keep their parameters in `message` and `.params`, including the full claims JSON (email, metadata, session ID) bound by `withRls`. Unhandled ones are printed by Next's server error logger and can reach Sentry breadcrumbs; `beforeSend` only rewrites the exception value (`src/libs/DB.ts:60`) | Confirmed: `DrizzleQueryError` builds `Failed query: … params: …` and stores `params` | Fixed |
| 17 | High | Security | Both Supabase server clients use `@supabase/ssr` defaults: `httpOnly: false`, no `Secure`. With no script CSP, any XSS can read the 400-day refresh token (`src/libs/Supabase.ts:16`, `src/proxy.ts:14`) | Confirmed: `DEFAULT_COOKIE_OPTIONS.httpOnly = false`; the app has no browser Supabase client | Fixed |
| 18 | Medium | Auth | Templates build links from `{{ .RedirectTo }}`, which Supabase replaces with the Site URL when the redirect is not allow-listed. The link then opens the home page and the token is silently ignored. The docs do not say to allow-list `<APP_URL>/**` (`supabase/templates/*.html`) | Not reproduced (hosted behaviour) | Fixed |
| 19 | Medium | RLS | The table-level `INSERT` grant lets users set `created_at`/`updated_at` on insert, for example through the Data API. `starter-handoff.md:88` claims server-managed columns cannot be changed; pgTAP only tests `UPDATE` (`supabase/migrations/20261027175951_…sql:15`) | Confirmed by reading the grant | Fixed |
| 20 | Medium | Tests | No test covers the sign-up confirmation link (`type=email`, `confirmation.html`, the `/app` branch of `confirmEmailLink`); local confirmations are off (`tests/e2e/Auth.e2e.ts`) | Confirmed | Fixed |
| 21 | Medium | Auth | `signIn` maps every non-429 error to "Invalid email or password.", including outages (`AuthRetryableFetchError`, 5xx) and `email_not_confirmed` (`src/actions/AuthActions.ts:61`) | Confirmed by reading the code | Fixed |
| 22 | Low | Config | `NEXT_PUBLIC_APP_URL` with a trailing slash produces `//auth/confirm` and `//sitemap.xml` (`AuthActions.ts:23`, `robots.ts`, `sitemap.ts`) | Confirmed by reading the code | Fixed |
| 23 | Low | Auth | A `weak_password` with reason `length` shows "Use 8 to 72 characters", which is wrong when a hosted project raises the minimum (`AuthActions.ts:41`) | Confirmed by reading the code | Fixed |
| 24 | Low | Accessibility | `global-error.tsx` has no `<title>`, always `lang="en"`, and shows English text from `NextError`; no axe check covers it | Confirmed | Fixed |
| 25 | Low | Accessibility | `/app/update-password` shares the layout's title with `/app` (WCAG 2.4.2) (`src/app/[locale]/app/layout.tsx:19`) | Confirmed | Fixed |
| 26 | Low | Tests | The `no-store` assertion in the recovery E2E test checks Next.js's own header (`action-handler.js` always sets it), so it cannot catch an app regression (`Auth.e2e.ts:182`) | Confirmed in `node_modules/next/dist/server/app-render/action-handler.js` | Fixed |
| 27 | Low | Performance | `withRls` uses two statements before the query; one `select set_config(…), set_config('role', 'authenticated', true)` would do (`DB.ts:62`) | Confirmed by reading the code | Fixed |
| 28 | Low | Cleanup | `getI18nPath` re-implements next-intl's `getPathname` with a hard-coded `as-needed` rule (`src/utils/Helpers.ts:9`) | Confirmed | Fixed |
| 29 | Low | Rules | `src/proxy.ts` imports `./libs/Env` and `./libs/I18nRouting` relatively; `AGENTS.md` requires `@/` outside the same directory | Confirmed | Fixed |
| 30 | Low | Rules | The `CI` variable is validated in `Env.ts` but missing from `.env.example` | Confirmed | Fixed |

### Fixes (second review)

| # | Change | Test that covers it |
|---|---|---|
| 16 | `withRls` rethrows `DrizzleQueryError` as `Database query failed (<SQLSTATE>)` with only a `code` (no parameters in the message, no `params`, no `cause`). `beforeSend` stays as a safety net | `DB.db.test.ts` "removes query parameters and claims from query errors" (failed before the fix) |
| 17 | `src/libs/SupabaseCookies.ts`: `httpOnly: true`, and `secure` when `NEXT_PUBLIC_APP_URL` uses HTTPS. Used by the proxy and `createClient` | E2E "hides the session cookies from scripts after sign-up and refresh" |
| 18 | README, `docs/architecture.md` and ADR-005 require Site URL = `NEXT_PUBLIC_APP_URL` and the redirect URL `<NEXT_PUBLIC_APP_URL>/**`, and explain the silent failure | Documentation only (hosted behaviour) |
| 19 | New migration `20261027215802_profiles_insert_timestamps.sql`: a `BEFORE INSERT` trigger sets both timestamps | pgTAP assertions 16 and 17 (plan 15 → 17) |
| 20 | A unit test reads both templates, fills `RedirectTo` and `TokenHash`, and parses the link with `EmailLinkValidation` | `AuthValidation.test.ts` (fails when `confirmation.html` uses `type=signup`) |
| 21 | `signIn`: `email_not_confirmed` shows "Confirm your email address first." (Supabase checks the password first; verified against local Auth). Retryable and 5xx errors show the generic error | Local Auth probe; no E2E (local confirmations are off) |
| 22 | `Env.ts` removes trailing slashes from `NEXT_PUBLIC_APP_URL` | Static checks |
| 23 | `weak_password` with reason `length` shows "Use a longer password." (Zod already enforces 8 to 72 bytes) | Not testable locally |
| 24 | New localized `[locale]/error.tsx` with a `<title>`; `global-error.tsx` renders the default locale's `ErrorPage` messages and a `<title>` | Static checks (no E2E can trigger a render error) |
| 25 | `/app/update-password` sets its own title; the `AGENTS.md` metadata rule now says so | Static checks |
| 26 | The recovery test no longer asserts `no-store` on the action POST. A new test asserts that a static page refreshing the session is `no-store`, and that the anonymous page is not | E2E "stops shared caches from storing a static page that refreshes the session" |
| 27 | One `set_config` statement sets the claims, `sub` and `role` | `test:db` 4/4 |
| 28 | `getI18nPath` and its tests removed; `robots.ts` and `sitemap.ts` use `getPathname` | Static checks |
| 29 | `proxy.ts` imports `@/libs/…` | Lint |
| 30 | `CI` documented in `.env.example` | None needed |

Verification (2026-10-28): locally, static checks, `npm test` (16), `npm run test:storybook` (6) and both builds pass; Docker Desktop stopped responding before the database tests. GitHub Actions run [40669838444](https://github.com/NMenzel/Next-js-Boilerplate/actions/runs/40669838444) on PR #1 (commit `487d4c0`) passed all four jobs: static checks with the audit gates (0 production advisories, 1131 verified signatures), 16 unit/component tests, 6 story tests, the production and Storybook builds, all three migrations applied from scratch, 17/17 pgTAP assertions, 4/4 Drizzle RLS tests, the schema drift check and 70/70 E2E tests (Chromium + Firefox). The first CI run failed in `npm ci`: CI's npm 11.19 rejected the lockfile written by npm 11.6 (missing optional `@emnapi/*` entries), fixed in `487d4c0`.
