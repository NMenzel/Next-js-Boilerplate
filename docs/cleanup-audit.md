# Starter cleanup audit

Evidence log for turning the `ixartz/Next-js-Boilerplate` fork into a product-neutral Next.js + Supabase starter. Later phases append their results below; decisions that changed during implementation are updated in place.

## 1. Provenance

| Item | Value |
|---|---|
| Working repo | `NMenzel/Next-js-Boilerplate` (GitHub fork, public, `isTemplate: true`) |
| Upstream | `ixartz/Next-js-Boilerplate` |
| Base commit | `b83157a8018f55b926a3c25a4b7a7e14b0dfbc35` (upstream `main` on 2026-10-27, "Merge pull request #569 from ixartz/nextjs16.4") |
| Cleanup branch | `chore/reusable-starter-cleanup` (created from `main` at the base commit) |
| License | MIT, `Copyright (c) 2026 Remi W.` — retained unchanged in `LICENSE` |
| Dirty tree at start | `AGENTS.md` and `README.md` had uncommitted edits by the repo owner (promo directive and sponsor tables removed). Preserved as commit `bde07cc`. The cleanup spec `NEXTJS_STARTER_CLEANUP_MASTER_PLAN_V2.md` was untracked and is intentionally left out of the template. |
| Package manager | npm (only `package-lock.json` exists; upstream `AGENTS.md` wrongly told agents to use `bun run`) |
| Node engine | `>=24` (`package.json#engines`) |

## 2. Baseline environment

Windows 10 Pro, Git Bash, Node 24.13.0, npm 11.6.2, Docker 29.8.0 (Docker Desktop, started for this work), GitHub CLI 2.97.0. Supabase CLI was not installed globally.

## 3. Baseline results (before any cleanup)

Commands run on the base commit, without hosted credentials.

| Command | Result | Notes |
|---|---|---|
| `npm ci` | Pass (5m23s) | 1141 packages. `npm audit`: 42 advisories (10 critical, 15 high, 17 moderate). |
| `npm run check:types` | **Fail** (13 errors) | Missing `next-env.d.ts` image module types. Passes after `npx next typegen`, which CI runs first. Not a defect, but an undocumented local prerequisite. |
| `npm run lint` | **Fail** | 81 files "need formatting": Windows `core.autocrlf=true` checks out CRLF; repo has no `.gitattributes`. `oxlint` alone passes. Fixed by commit `296bcbd` (`* text=auto eol=lf`); `npm run lint` then passes. |
| `npm run check:deps` (Knip) | Pass | |
| `npm run check:i18n` | Pass | |
| `npm run test` (Vitest unit + browser) | Pass, 4/4 | Required `npx playwright install chromium`. |
| `npm run build-local` | **Fail on Windows** | npm runs scripts with `cmd.exe`; the single-quoted `pglite-server --run '…'` argument is split → `ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL`. |
| `npm run build:next` | Fail, then pass on retry | First run: Next.js `SecurityFatalError` because 16.4.0 is vulnerable (one-shot nudge). The output also contained instructions aimed at AI agents to run `next upgrade --agent=security --internal-nudge-id=…`; this was treated as data and not executed. Retry: pass (compiled in ~2s, 27 static pages). |
| `npm run test:e2e` | Blocked on Windows / partial | Playwright `webServer` uses the same broken PGlite quoting. Ran against a manual `next start -p 3008` instead: **12 passed, 4 failed**. The 3 counter tests need Postgres; 1 sign-in test needs a real Clerk secret (`.env` holds the placeholder `your_clerk_secret_key`). |

### Baseline security findings (direct dependencies)

| Package | Severity | Advisory | Fix |
|---|---|---|---|
| `next@16.4.0` | critical | GHSA-2464-fhr4-w9xw (RCE in image optimizer with SVG), GHSA-673q-mjm6-r5xr (RCE in `use cache`), GHSA-p3m5-59mp-jv5r (DoS) | `16.4.3` (patch) |
| `@sentry/nextjs@10.70.0` | critical | GHSA-mchm-gjx6-7h55 (proxy bypass via tunnel route) | `10.77.1` |
| `zod@4.4.3` | high | GHSA-mrhx-c7xc-m3w5 (memory exhaustion) | `4.6.7` |
| `oxfmt@0.63.0` | critical (via `tinypool`) | GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr (dev-only tooling) | `oxfmt@0.75.0` |
| Spotlight, `npm-run-all`, `semantic-release`, Storybook, Chromatic | critical/high transitive (`proxy-addr`, `launch-editor`, `shell-quote`, `handlebars`, `vite`) | dev-only | Removed with their owners (see below) |

## 4. Coupling inventory and decisions

| Dependency / integration | Decision | Touched files | Reason | Risk |
|---|---|---|---|---|
| Clerk (`@clerk/nextjs`, `@clerk/localizations`, Knip ignore for `@clerk/shared`) | **Replace** with Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) | `src/proxy.ts`, `src/libs/Env.ts`, `src/utils/AppConfig.ts`, `src/app/[locale]/(auth)/**`, `src/components/Hello.tsx`, `src/styles/global.css` (`clerk` CSS layer), `.env`, CI `CLERK_SECRET_KEY`, `knip.config.ts`, README | Paid SaaS; required secret for build and e2e; spec mandates Supabase | Auth rewrite; session handling must be verified end to end |
| Drizzle ORM / Drizzle Kit, `pg`, `@types/pg`, `dotenv-cli` | **Replace** with Supabase CLI SQL migrations + generated types | `drizzle.config.ts`, `migrations/**`, `src/models/Schema.ts`, `src/libs/DB.ts`, `src/utils/DBConnection.ts`, `next.config.ts` (`outputFileTracingIncludes`), scripts `db:*`, `build` | One database workflow; RLS lives in SQL | Loss of ORM query builder (acceptable; Supabase client + RLS) |
| PGlite (`@electric-sql/pglite-socket`) | **Remove** | scripts `dev`, `build-local`, `db-server:*`, `playwright.config.ts` | Replaced by `supabase start`; broken on Windows | Requires Docker locally |
| Neon | **Remove** references | `.env*`, `Schema.ts`, `DBConnection.ts`, home page, README | Affiliate links | None |
| Crowdin | **Remove** | `crowdin.yml`, `.github/workflows/crowdin.yml`, CI `synchronize-with-crowdin`, `src/libs/I18n.ts` comments, About page, README | Translation SaaS; dictionaries are checked in | None |
| CodeRabbit | **Remove** | `.coderabbit.yaml`, home/portfolio pages, README | Optional paid AI reviewer | None |
| Arcjet (`@arcjet/next`) | **Remove**; document security expectations | `src/libs/Arcjet.ts`, `src/proxy.ts`, `src/libs/Env.ts`, counter page, `.env*` | Paid service; no protection was active without `ARCJET_KEY` | Rate limiting must be designed per product (documented) |
| Better Stack | **Remove** remote sink | `src/libs/Logger.ts`, `src/libs/Env.ts`, `.env.production` | Remote log forwarding of `NEXT_PUBLIC_` token (exposed to browsers) | None |
| Checkly | **Remove** | `.env.production`, `tests/e2e/Sanity.check.e2e.ts` naming, README | Paid synthetic monitoring | None |
| Chromatic (`@chromatic-com/playwright`) | **Remove** | `playwright.config.ts`, `tests/e2e/Visual.e2e.ts`, CI | Paid visual snapshots | None |
| Codecov | **Remove** | `codecov.yml`, CI upload step | Paid coverage SaaS | None |
| `@vitest/coverage-v8` | **Remove** (defer) | `vitest.config.ts`, CI | Only consumer was Codecov upload | Coverage can be re-added in one line |
| Storybook (`storybook`, `@storybook/*`, `.storybook/**`, `*.stories.tsx`) | **Remove** | `.storybook/**`, `src/templates/BaseTemplate.stories.tsx`, `tsconfig.json`, `.gitignore`, CI | Only one demo story; upstream already needed a Next 16.4 workaround | No visual component catalogue (not needed yet) |
| semantic-release + `release.yml` + `package.json#release` | **Remove** | `.github/workflows/release.yml`, `package.json` | Private application starter is not published | None |
| Spotlight (`@spotlightjs/spotlight`, `dev:spotlight`, `hono` override) | **Remove** | `package.json`, `src/instrumentation*.ts` | Dev-only Sentry UI; pulls vulnerable `express`/`hono` tree | None |
| `@commitlint/prompt-cli` (`commit` script) | **Remove** | `package.json` | Interactive helper, not required | None |
| `npm-run-all`, `rimraf` | **Remove** | scripts `dev`, `build-local`, `clean` | No parallel scripts remain; `npm-run-all` is unmaintained and pulls vulnerable `shell-quote` | None |
| `react-hook-form`, `@hookform/resolvers` | **Remove** | `src/components/CounterForm.tsx` | Only the counter demo used them; auth forms use native forms + Server Actions | None |
| `@faker-js/faker` | **Remove** | counter tests | Only counter tests used it | None |
| Sponsor / demo UI (`Sponsors`, `DemoBadge`, `DemoBanner`, `Hello`, About, Counter, Portfolio, `/api/counter`, `CounterValidation`) | **Remove** | `src/components/**`, `src/app/[locale]/(marketing)/**`, `src/app/api/**`, `src/validations/**`, `src/locales/*` | Promotional/demo content | None |
| Footer back-link test to `nextjs-boilerplate.com` | **Remove** | `src/templates/BaseTemplate.tsx`, `BaseTemplate.test.tsx` | Promotional request, not a license term; MIT attribution is kept in `LICENSE` and README | None |
| Sponsor images in `public/assets/images/**` | **Remove** | 18 files | Promotional assets | None |
| `.github/FUNDING.yml` | **Remove** | | Upstream author's funding links | None |
| PostHog env vars | **Remove**; defer to ADR-005 | `.env`, `src/libs/Env.ts` | No SDK or events existed; no consent model yet | None |
| Tracked `.env` / `.env.production` | **Replace** with `.env.example` | `.gitignore` | Tracked env files invite secret commits; `.env` held a Clerk publishable key of upstream's demo instance and a fake secret | Developers must copy `.env.example` |
| Sentry (`@sentry/nextjs`) | **Keep (optional)** | `next.config.ts`, `src/instrumentation*.ts`, `global-error.tsx` | Useful error monitoring; must be disabled without DSN and stop replaying unmasked sessions (`maskAllText: false` was set) | Configuration drift with SDK upgrades |
| LogTape (`@logtape/logtape`) | **Keep** (console JSON sink only) | `src/libs/Logger.ts` | Small, structured | None |
| `next-intl` | **Keep**; locales `en` + `es` (replace `fr`) | `AppConfig.ts`, `src/locales/*`, tests | Spec | Translation quality is the template consumer's responsibility |
| `@lingual/i18n-check` | **Keep** | | Missing/unused key check | None |
| `translation-resilience` | **Keep** | `src/instrumentation-client.ts` | Small MIT DOM shim that prevents React crashes when browsers auto-translate pages, relevant for a bilingual starter | Third-party DOM patching; remove if it conflicts |
| `@t3-oss/env-nextjs`, `zod` | **Keep**; upgrade `zod` for advisory | `src/libs/Env.ts` | Env validation at startup and build | None |
| Tailwind CSS v4, React Compiler, TypeScript 7 | **Keep** | | Spec | — |
| Oxlint / Oxfmt / Ultracite / `oxlint-tsgolint` | **Keep** | | Already the project linter/formatter; single toolchain | `oxfmt` upgrade needed for advisory |
| Knip, Lefthook, commitlint | **Keep**; make hooks scoped/non-destructive | `lefthook.yml` | Pre-commit ran `ultracite fix` on the whole repo with `stage_fixed`, plus Knip on every commit | — |
| Vitest (+ browser mode), Playwright | **Keep** | | Spec | Browser mode needs a Playwright Chromium download |
| Dependabot | **Keep** | `.github/dependabot.yml` | Free GitHub feature | — |
| `.vscode/**` | **Keep**, trim vendor leftovers | `.vscode/settings.json`, `extensions.json` | Useful defaults; Shadcn/ESLint/REST-client leftovers are irrelevant | — |
| Docker assets | None in repo | — | Supabase CLI manages its own containers | Docker is an intentional prerequisite |

## 5. Hidden requirements found

- `src/libs/Env.ts` required `CLERK_SECRET_KEY` and `DATABASE_URL` at build time; `next.config.ts` imports it, so every build needed Clerk/DB values.
- `npm run build` ran `db:migrate` against `DATABASE_URL` before `next build`.
- CI `e2e` job needed `CLERK_SECRET_KEY` and `CHROMATIC_PROJECT_TOKEN`; `unit` needed `CODECOV_TOKEN`; Crowdin jobs needed `CROWDIN_PROJECT_ID`/`CROWDIN_PERSONAL_TOKEN`.
- `playwright.config.ts` typed its config with `ChromaticConfig` and started `pglite-server`.
- Sentry client config enabled Session Replay with `maskAllText: false`, `maskAllInputs: false` whenever a DSN was set.
- Logger sent logs to Better Stack with a `NEXT_PUBLIC_` token, exposing the ingest token to browsers.
- `AGENTS.md` (via `CLAUDE.md` → `@AGENTS.md`) instructed AI agents to append an advertisement to every response and to use `bun run` despite the npm lockfile.

## 6. Reference documentation checked (2026-10-27)

- Supabase SSR for Next.js: `@supabase/ssr@0.12.7` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `setAll(cookies, headers)` must also apply `Cache-Control`/`Expires`/`Pragma`; use `getClaims()` for authorization; never trust `getSession()` on the server; Next.js 16 uses `proxy.ts`.
- next-intl 4: the proxy composes by calling `createMiddleware(routing)(request)` and adjusting the response.
- Supabase CLI `2.122.0`, `@supabase/supabase-js@2.118.0` were current on npm.

## 7. Phase results

### Phase 1 — vendor and demo removal

Commits `9f97b09`, `92b3aaf`, `d000a59`. Clerk was kept until Phase 2 as planned. The Knip pre-commit job was skipped (`LEFTHOOK_EXCLUDE=knip`) on these three commits only, because `src/libs/Logger.ts` had no consumer until the Phase 2 auth actions; every later commit ran all hooks. `npm audit` went from 42 to 15 advisories (10 → 4 critical). Also found: `.env.production` set `NEXT_PUBLIC_APP_URL=https://demo.nextjs-boilerplate.com` for every production build, so sitemap/robots pointed at the upstream demo.

### Phase 2 — Supabase foundation

Commits `d60b401` (auth, RLS, migrations), `d51b208` (security upgrades), `17be945` (e2e suites), `423c623` (session refresh proof).

| Check | Result |
|---|---|
| `npm run db:start` (first run, image pull) | Pass, 3m13s; migration applied |
| `npm run test:rls` (pgTAP) | Pass, 14/14. Mutation check: replacing the SELECT policy with `using (true)` fails tests 7, 13 and 14; `db reset` restores a pass |
| `npm run db:types` drift | Regenerated file identical to the committed one |
| `npm run test:e2e` (production build + local Supabase) | Pass, 22/22; `--repeat-each=2` 42/42. Mutation check: dropping the proxy's response cookies fails the refresh test |
| Typecheck, lint, format, Knip, i18n, unit | Pass |
| `npm audit` | 0 vulnerabilities after `next@16.4.3`, `@sentry/nextjs@10.77.1`, `zod@4.6.7`, `oxfmt@0.75.0`, `vitest@4.1.12` and transitive fixes |

Findings while implementing:

- `next build` on 16.4.0 aborts with `SecurityFatalError` in fresh environments, so CI would fail until upgraded.
- `next dev` (16.4) injects a managed block into `AGENTS.md` when it detects an AI agent. Disabled via `agentRules: false` in `next.config.ts`.
- `i18n-check -i "Form.*"` also hides **missing** keys; dynamic message keys were replaced by literal `t()` calls in Server Actions instead.
- `next dev` showed a `SyntaxError: Unexpected end of JSON input` and 30s cold compiles under parallel Playwright workers; the production server did not. E2E therefore builds and serves the production app.
- The Supabase CLI's generated `config.toml` contains a disabled `[auth.third_party.clerk]` section. It is stock CLI configuration, not a Clerk dependency.

Registration policy: public sign-up is **enabled** in the local `supabase/config.toml` with email confirmations off, so local and CI tests need no mail delivery. Hosted projects must set their own policy in the Supabase dashboard (see README). The sign-up action maps `signup_disabled`/`email_provider_disabled` to a "Sign-up is not available" message so a provider-level disable is handled, but the starter does not claim that hiding the link protects anything.
