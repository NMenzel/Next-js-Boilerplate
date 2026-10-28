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
| Data | Drizzle ORM and Drizzle Kit (now RLS-scoped through `withRls()`), `pg` | Drizzle's own migration runner/PGlite/Neon → Drizzle Kit SQL in `supabase/migrations/` applied by the Supabase CLI; `profiles` with owner-only RLS; pgTAP and Drizzle RLS tests | Counter demo and API, `dotenv-cli`, migrate-on-build |
| Forms | React Hook Form, Zod | Counter form → shared `ActionForm` (client validation with the Server Action's Zod schema, works without JavaScript) | |
| i18n | next-intl, i18n-check | `fr` → `es`; Crowdin → checked-in dictionaries | Crowdin config and workflows |
| UI/a11y | Tailwind utilities, Storybook (now with axe-gated story tests) | Auto-navigating select → language links | |
| Observability | LogTape (console, redacted), Sentry (opt-in) | | Better Stack sink, Spotlight, Session Replay, Sentry tunnel |
| Security | | Arcjet → documented expectations, security headers, server-chosen redirect targets | Arcjet |
| Tooling | Oxlint/Oxfmt/Ultracite, Knip, Lefthook (now check-only), commitlint, Vitest, Playwright, Dependabot, npm-run-all (`check`, `verify`), rimraf (`clean`), semantic-release (GitHub releases only) | CI rewritten without secrets | Chromatic, Codecov, CodeRabbit, Checkly, faker, `@commitlint/prompt-cli` |

Storybook, React Hook Form, Drizzle, semantic-release, npm-run-all and rimraf were removed in Phase 1 and restored at the owner's request. Each now has a consumer and a test or CI step; see [the reintegration log](cleanup-audit.md#owner-requested-reintegration).

**Not built (by design):** no product schema or features, no uploads/buckets/media tables, no queues/workers/cron, no analytics SDK, events, consent UI or session replay, no branded or localized emails (only the two auth link templates), no deployment. Future designs are in [ADR-002](decisions/ADR-002-signed-uploads.md) to [ADR-005](decisions/ADR-005-privacy-and-deployment.md), all marked **not implemented**.

## Final dependency set

- Runtime (16): `next@16.4.3`, `react`/`react-dom@19.2.8`, `@supabase/ssr@0.12.7`, `@supabase/supabase-js@2.118.0`, `drizzle-orm@0.45.4`, `pg@8.23.1`, `react-hook-form@7.91.0`, `@hookform/resolvers@6.0.1`, `zod@4.6.7`, `next-intl@4.13.4`, `@t3-oss/env-nextjs@0.13.11`, `@logtape/logtape@2.4.2`, `@logtape/redaction@2.4.2`, `@sentry/nextjs@10.77.1`, `translation-resilience@0.3.0`.
- Dev (33): Supabase CLI `2.122.0`, `drizzle-kit@0.31.11`, Storybook `10.6.5` (`@storybook/nextjs-vite`, `addon-docs`, `addon-a11y`, `addon-vitest`), `semantic-release@25.0.9` with the Conventional Commits preset, `npm-run-all@4.1.5`, `rimraf@6.1.3`, TypeScript 7, Tailwind 4, Oxlint/Oxfmt/Ultracite, Knip, Lefthook, commitlint, i18n-check, Vitest 4 (+ browser mode), Playwright 1.62, `@axe-core/playwright`.
- Baseline: 16 runtime + 45 dev dependencies, 1141 installed packages, 42 advisories (10 critical). Before the reintegration: 12 + 22, about 500 installed, 0 advisories. Now: 16 + 33, 1116 installed; `npm audit` reports 6 dev-only advisories (1 high, 5 moderate, 0 critical, none in production dependencies); `npm audit signatures` verifies 1113 packages.

## Verification (2026-10-27, Windows 10, Node 24.13, Docker Desktop)

Run in a fresh clone of the branch at `511c9c8` (`npm ci` + `cp .env.example .env.local`, no other files). After the [code review](code-review.md) fixes (`068ff33`…`0f33cc8`), the suite was re-run in the working copy: `npm run verify` passes with 16 unit/component tests, 6 story tests, 15 pgTAP assertions, 3 Drizzle tests and 33 E2E tests, `CI=true npm run test:e2e` passes 66/66, and `npm run build-storybook` passes. The table below shows the fresh-clone run before those fixes.

| Command | Result |
|---|---|
| `npm ci` | Pass, 2m59s |
| `npm run check` (typecheck, lint, format, Knip, i18n, `drizzle-kit check`) | Pass, 35s |
| `npm test` | Pass, 15 tests (Node + Chromium) |
| `npm run test:storybook` | Pass, 5 stories (play functions + axe) |
| `npm run build` with no Supabase container running and no hosted credentials | Pass (Sentry off, 16 static pages) |
| `npm run build-storybook` | Pass |
| `npm run db:start`, then `npm run db:reset` | Pass; both migrations replayed from scratch |
| `npm run test:rls` | Pass, 15/15 pgTAP assertions |
| `npm run test:db` | Pass, 3/3 (Drizzle queries through `withRls()`) |
| `npx drizzle-kit generate` + `git status --porcelain supabase/migrations` | "No schema changes"; no drift |
| `npm run test:e2e` | Pass, 26/26 (Chromium) |
| `CI=true npm run test:e2e` | Pass, 52/52 (Chromium + Firefox) |
| `npm run verify` (all of the above in sequence) | Pass, 1m24s |
| `npm run clean` | Removed `.next`, `test-results`, `storybook-static` |
| `npm audit --omit=dev --audit-level=high`, `npm audit --audit-level=critical`, `npm audit signatures` | Pass (the CI gates) |
| `actionlint` (Docker) on `.github/` | No findings |
| `next dev` route smoke test (sequential) | `/`, `/es`, auth pages 200; `/app` and `/es/app` → 307 to localized sign-in; unknown path 404 |
| `semantic-release --dry-run --no-ci` (offline: temporary clone with a local bare repository as the remote, GitHub plugin disabled) | Commits analyzed with the Conventional Commits preset (1,764 commits, no previous tag); next version `1.0.0`. The GitHub plugin and publishing were not exercised |

Mutation checks (tests fail when the protection is removed):

| Removed protection | Failing check |
|---|---|
| Owner-only SELECT policy replaced by `using (true)` | pgTAP 7, 13, 14 |
| `set local role authenticated` in `withRls()` | All 3 `test:db` tests |
| Refreshed cookies not forwarded by the proxy | E2E session refresh test |
| Label of a story input | 3 story tests (axe "Form elements must have labels") |
| `scope: 'local'` in `signOut()` (set to `global`) | E2E "signs out only the current browser" |
| Log redaction | Logger unit test |
| One Spanish key | `check:i18n` |

**CI:** GitHub Actions run [40669838444](https://github.com/NMenzel/Next-js-Boilerplate/actions/runs/40669838444) on PR #1 (commit `487d4c0`) passed all four jobs: static checks with the audit gates (0 production advisories, 1131 verified signatures), 16 unit/component tests, 6 story tests, the production and Storybook builds, all three migrations applied from scratch, 17/17 pgTAP assertions, 4/4 Drizzle RLS tests, the schema drift check and 70/70 E2E tests (Chromium + Firefox). Job times: static checks 85 s, build 73 s, unit and story tests 81 s, database and E2E 200 s. **Not verified:** the release workflow has not run (it starts after a green CI push to `main`); hosted Supabase, the Supabase pooler, real email delivery and a live Sentry project were not used.

### Auth, session and RLS evidence

- Sign-up → `/app` shows the email; sign-out → home; `/app` → sign-in; sign-in works again.
- Sign-up also works with JavaScript disabled (native form post to the Server Action).
- Wrong password → generic "Invalid email or password." in `role="alert"`; email preserved.
- Invalid input is rejected in the browser before the Server Action runs (React Hook Form + Zod); the server re-validates.
- Session survives locale switch (`/app` → `/es/app`) and reloads; an access token expired in the cookie is refreshed by the proxy (new refresh token, future expiry) without sign-out.
- Profile display name saved and read through Drizzle as `authenticated`, persisted across reloads.
- Password recovery: link from Mailpit, fetched once by a scanner-style GET, then opened in a **second browser** → confirm page → Continue → `/app/update-password` → new password signs in. The verifying POST answers with `Cache-Control: … no-store`.
- Confirm links with missing parameters or an invalid token → `/sign-in?error=link_invalid` on the app origin; a `next=//evil.example` parameter is ignored (the app has no user-supplied redirects).
- Signing out in one browser keeps the user's other browser signed in, even after a forced token refresh.
- pgTAP: anonymous read/insert denied; owner insert/select/update allowed; cross-user insert, read, update, ownership reassignment and delete denied; server-managed columns cannot be changed; check constraint enforced.
- Drizzle (`test:db`): only the signed-in user's rows are returned; updates to another user's row affect nothing; inserting for another user fails with `42501`.

### Locales and accessibility evidence

- `en` (no prefix) and `es` (`/es`) for all pages, `<html lang>` per locale, localized 404 with status 404.
- axe (WCAG 2.0–2.2 A/AA tags) reports no violations on home, sign-in, sign-up, forgot-password (en/es), the signed-in app page and every Storybook story.
- Skip link is the first focus stop and jumps to `#main`; invalid fields get `aria-invalid` and an accessible description; layout checked at 320 px.

## Known risks and limitations

1. **Privileged database connection.** `DATABASE_URL` connects as `postgres` and bypasses RLS. Only `withRls()` switches to `authenticated`; a direct `db` query would skip RLS. Keep the URL secret and use the Supabase pooler in hosted environments.
2. **Accepted dev-only advisories.** `undici` (high) and `ip-address` (moderate) are bundled in the `npm` package used by semantic-release and run only in the release job. `esbuild` (moderate) is bundled by `drizzle-kit`, which does not start esbuild's dev server. CI fails on any high production advisory or any critical advisory.
3. **First release on this fork.** No tags exist, so the first semantic-release run on `main` would publish `1.0.0` with notes for all 1,764 inherited upstream commits. Start the standalone template from fresh history, or tag the merge commit manually first.
4. **Next.js dev-server race** ([vercel/next.js#96664](https://github.com/vercel/next.js/issues/96664)): parallel first requests can corrupt `.next/dev/prerender-manifest.json`, causing 500s in `next dev` until restart. A Turbopack dev panic ("Couldn't find chunk group index") was also seen once under the same conditions and not reproduced with sequential requests. Production is unaffected; E2E uses `next start`.
5. No script/style CSP (needs nonces); headers cover framing, MIME sniffing, referrer, permissions and HSTS.
6. No application-level rate limiting; Supabase Auth limits must be tuned per hosted project.
7. Local sign-up has email confirmation off and a raised local sign-in/sign-up rate limit (100 per 5 min) for tests; hosted settings are separate.
8. Spanish copy has not been reviewed by a native speaker; accessibility has no manual screen reader audit.
9. `translation-resilience` patches DOM methods to survive browser auto-translation; remove it if it conflicts with a future library.
10. CI needs npm 11.19 or newer to accept the lockfile; regenerate it with a current npm (`npx npm@latest install --package-lock-only`) if `npm ci` reports missing optional packages.

## Publish as a standalone template (requires owner approval)

Nothing below has been done. Pick one option from [ADR-001](decisions/ADR-001-starter-and-child-projects.md):

1. Review and merge the branch: open a PR from `chore/reusable-starter-cleanup` into `main` **of `NMenzel/Next-js-Boilerplate`** (not into `ixartz`), let CI pass, merge. The merge triggers `release.yml`; see risk 3 before merging.
2. Choose how the template repository relates to upstream:
   - **Keep the fork:** already `isTemplate: true`; nothing else to do.
   - **Leave the fork network (recommended):** *Settings → General → Danger Zone → Leave fork network* (public fork, < 1 GB, no child forks). Permanent; drops issues/PRs/stars, keeps history.
   - **New standalone repo:** create an empty repository (for example `nextjs-supabase-starter`), then `git push https://github.com/<owner>/<repo>.git chore/reusable-starter-cleanup:main`, and enable *Settings → Template repository*. For a release history without upstream commits, push a squashed or fresh history instead.
3. In the template repository, confirm Actions are enabled and the first CI and release runs are green. `release.yml` requests `contents`, `issues` and `pull-requests` write permissions explicitly; if it fails with a permission error, check the organization's Actions policy.

## Start the first product repository

1. *Use this template* (or `gh repo create <owner>/<product> --private --template <owner>/<template-repo>`), then clone it.
2. `npm ci`, `cp .env.example .env.local`, `npx playwright install chromium`, `npm run db:start`, `npm run dev`; run `npm run verify`.
3. Rename the app in `src/utils/AppConfig.ts`, `package.json#name` and `supabase/config.toml#project_id`; update locales.
4. Decide whether the product publishes GitHub releases; if not, delete `.github/workflows/release.yml`, `package.json#release` and the semantic-release dependencies.
5. Decide the registration policy and configure the hosted Supabase project (ADR-005 checklist), including a pooled `DATABASE_URL`; add tables in `src/models/Schema.ts` with RLS policies, pgTAP tests and `test:db` tests.
6. Implement product domains in feature folders (ADR-004), signed media uploads (ADR-002) and durable jobs (ADR-003) only when real workloads need them, then analytics with consent (ADR-005).
