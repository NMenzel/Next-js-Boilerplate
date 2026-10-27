# Starter handoff

Status of the reusable Next.js + Supabase starter after the cleanup of the `ixartz/Next-js-Boilerplate` fork. Evidence and baseline details: [cleanup-audit.md](cleanup-audit.md).

## Provenance

| Item | Value |
|---|---|
| Source | `ixartz/Next-js-Boilerplate` at `b83157a8018f55b926a3c25a4b7a7e14b0dfbc35` (MIT) |
| Working repository | `NMenzel/Next-js-Boilerplate` (public fork, `isTemplate: true`) |
| Cleanup branch | `chore/reusable-starter-cleanup` (not pushed, not merged) |
| Commits | `bde07cc` … see `git log b83157a..chore/reusable-starter-cleanup` |

## Implemented scope

| Area | Retained | Replaced | Removed |
|---|---|---|---|
| Framework | Next.js 16 App Router (Node runtime), React 19, React Compiler (prod), TypeScript strict, Tailwind 4 | | Marketing/demo pages, sponsor UI and assets, demo badge/banner, footer back-link |
| Auth | | Clerk → Supabase Auth (`@supabase/ssr`): sign-up, sign-in, sign-out, password reset, protected `/app`, session refresh in `proxy.ts` | Clerk localizations |
| Data | | Drizzle/PGlite/Neon → Supabase CLI migrations, `profiles` with owner-only RLS, pgTAP tests, generated types | Counter demo and API |
| i18n | next-intl, i18n-check | `fr` → `es`; Crowdin → checked-in dictionaries | Crowdin config and workflows |
| UI/a11y | Tailwind utilities | Auto-navigating select → language links | |
| Observability | LogTape (console, redacted), Sentry (opt-in) | | Better Stack sink, Spotlight, Session Replay, Sentry tunnel |
| Security | | Arcjet → documented expectations, security headers, redirect validation | Arcjet |
| Tooling | Oxlint/Oxfmt/Ultracite, Knip, Lefthook (now check-only), commitlint, Vitest, Playwright, Dependabot | CI rewritten without secrets | Storybook, Chromatic, Codecov, CodeRabbit, Checkly, semantic-release, npm-run-all, rimraf, faker, React Hook Form |

**Not built (by design):** no product schema or features, no uploads/buckets/media tables, no queues/workers/cron, no analytics SDK, events, consent UI or session replay, no email templates, no deployment. Future designs are in [ADR-002](decisions/ADR-002-signed-uploads.md) to [ADR-005](decisions/ADR-005-privacy-and-deployment.md), all marked **not implemented**.

## Final dependency set

- Runtime (12): `next@16.4.3`, `react`/`react-dom@19.2.8`, `@supabase/ssr@0.12.7`, `@supabase/supabase-js@2.118.0`, `next-intl@4.13.4`, `zod@4.6.7`, `@t3-oss/env-nextjs@0.13.11`, `@logtape/logtape@2.4.2`, `@logtape/redaction@2.4.2`, `@sentry/nextjs@10.77.1`, `translation-resilience@0.3.0`.
- Dev (22): Supabase CLI `2.122.0`, TypeScript 7, Tailwind 4, Oxlint/Oxfmt/Ultracite, Knip, Lefthook, commitlint, i18n-check, Vitest 4 (+ browser mode), Playwright 1.62, `@axe-core/playwright`.
- Baseline had 16 runtime + 45 dev dependencies and 1141 installed packages with 42 advisories (10 critical). Now ~500 installed packages and `npm audit` reports 0 vulnerabilities; `npm audit signatures` verifies 499 packages.

## Verification (2026-10-27, Windows 10, Node 24.13, Docker Desktop)

All commands were run in the working copy **and** in a fresh clone of the branch (`npm ci` + `cp .env.example .env.local`, no other files).

| Command | Result |
|---|---|
| `npm ci` (fresh clone) | Pass, 2m16s, 0 vulnerabilities |
| `npm run typecheck` | Pass |
| `npm run lint` / `npm run format:check` | Pass |
| `npm run check:deps` (Knip) / `npm run check:i18n` | Pass |
| `npm test` | Pass, 13 tests (Node + Chromium) |
| `npm run build` without any hosted credentials | Pass (Sentry off); also passes with a placeholder DSN and no auth token |
| `npm run db:start` from scratch (`stop --no-backup`), CI service set | Pass, migrations replayed |
| `npm run test:rls` | Pass, 14/14 pgTAP assertions |
| `npm run db:types` + `git diff --exit-code` | No drift |
| `npm run test:e2e` | Pass, 25/25 (Chromium) |
| `CI=true npm run test:e2e` | Pass, 50/50 (Chromium + Firefox) |
| `npm audit --audit-level=high`, `npm audit signatures` | Pass |
| `actionlint` on `.github/` | No findings |
| `npm run dev` route smoke test | `/`, `/es`, auth pages 200; `/app` and `/es/app` → 307 to localized sign-in; unknown path 404 |

Mutation checks (tests fail when the protection is removed): permissive SELECT policy (RLS tests 7, 13, 14 fail), proxy not forwarding refreshed cookies (session refresh test fails), logger without redaction (unit test fails), missing Spanish key (`check:i18n` fails).

**Not verified:** GitHub Actions has not run on GitHub (nothing was pushed); the workflow was validated with actionlint and every step was run locally. Hosted Supabase, real email delivery and a live Sentry project were not used.

### Auth, session and RLS evidence

- Sign-up → `/app` shows the email; sign-out → home; `/app` → sign-in; sign-in works again.
- Wrong password → generic "Invalid email or password." in `role="alert"`; email preserved.
- Session survives locale switch (`/app` → `/es/app`) and reloads; an access token expired in the cookie is refreshed by the proxy (new refresh token, future expiry) without sign-out.
- Profile display name saved through RLS and persisted.
- Password recovery: link from Mailpit → PKCE callback → `/app/update-password` → new password signs in.
- `/auth/callback?code=invalid&next=//evil.example` → same-site `/sign-in?error=link_invalid`; unit tests cover `https://`, `//`, `/\`, tab, newline and `javascript:` targets.
- pgTAP: anonymous read/insert denied; owner insert/select/update allowed; cross-user insert, read, update, ownership reassignment and delete denied; check constraint enforced.

### Locales and accessibility evidence

- `en` (no prefix) and `es` (`/es`) for all pages, `<html lang>` per locale, localized 404 with status 404.
- axe (WCAG 2.0–2.2 A/AA tags) reports no violations on home, sign-in, sign-up, forgot-password (en/es) and the signed-in app page.
- Skip link is the first focus stop and jumps to `#main`; invalid fields get `aria-invalid` and an accessible description; layout checked at 320 px.

## Known risks and limitations

1. **Next.js dev-server race** ([vercel/next.js#96664](https://github.com/vercel/next.js/issues/96664)): parallel first requests can corrupt `.next/dev/prerender-manifest.json`, causing 500s in `next dev` until restart. A Turbopack dev panic ("Couldn't find chunk group index") was also seen once under the same conditions and not reproduced with sequential requests. Production is unaffected; E2E uses `next start`.
2. No script/style CSP (needs nonces); headers cover framing, MIME sniffing, referrer, permissions and HSTS.
3. No application-level rate limiting; Supabase Auth limits must be tuned per hosted project.
4. Local sign-up has email confirmation off and a raised local sign-in/sign-up rate limit (100 per 5 min) for tests; hosted settings are separate.
5. Spanish copy has not been reviewed by a native speaker; accessibility has no manual screen reader audit.
6. `translation-resilience` patches DOM methods to survive browser auto-translation; remove it if it conflicts with a future library.
7. GitHub Actions runtime (Docker image pulls, Firefox install) is unmeasured until the first run on GitHub.

## Publish as a standalone template (requires owner approval)

Nothing below has been done. Pick one option from [ADR-001](decisions/ADR-001-starter-and-child-projects.md):

1. Review and merge the branch: open a PR from `chore/reusable-starter-cleanup` into `main` **of `NMenzel/Next-js-Boilerplate`** (not into `ixartz`), let CI pass, merge.
2. Choose how the template repository relates to upstream:
   - **Keep the fork:** already `isTemplate: true`; nothing else to do.
   - **Leave the fork network (recommended):** *Settings → General → Danger Zone → Leave fork network* (public fork, < 1 GB, no child forks). Permanent; drops issues/PRs/stars, keeps history.
   - **New standalone repo:** create an empty repository (for example `nextjs-supabase-starter`), then `git push https://github.com/<owner>/<repo>.git chore/reusable-starter-cleanup:main`, and enable *Settings → Template repository*.
3. In the template repository, confirm Actions are enabled and the first CI run is green.

## Start the first product repository

1. *Use this template* (or `gh repo create <owner>/<product> --private --template <owner>/<template-repo>`), then clone it.
2. `npm ci`, `cp .env.example .env.local`, `npm run db:start`, `npm run dev`; run `npm test`, `npm run test:rls`, `npm run test:e2e`.
3. Rename the app in `src/utils/AppConfig.ts`, `package.json#name` and `supabase/config.toml#project_id`; update locales.
4. Decide the registration policy and configure the hosted Supabase project (ADR-005 checklist); add product migrations with RLS tests.
5. Implement product domains in feature folders (ADR-004), signed media uploads (ADR-002) and durable jobs (ADR-003) only when real workloads need them, then analytics with consent (ADR-005).
