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
