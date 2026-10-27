# Next.js + Supabase starter

A product-neutral starter for server-rendered web apps: Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase Auth and Postgres with Row Level Security, English/Spanish localization, accessible forms, and a CI pipeline that runs entirely on local services.

Everything runs locally with Docker. No paid account, hosted project or API key is needed for development, tests, CI or production builds.

## What is included

- **Next.js 16** App Router on the Node.js runtime, React 19, React Compiler (production builds), Tailwind CSS 4
- **Supabase Auth** with `@supabase/ssr`: email/password sign-up, sign-in, sign-out, password reset via email link, session refresh in `src/proxy.ts`, protected `/app` area
- **Supabase Postgres** via the Supabase CLI: SQL migrations, generated TypeScript types, an owner-only `profiles` table and pgTAP RLS tests
- **next-intl** with `en` (default) and `es`, checked-in dictionaries and automated key checks
- **Accessible UI**: semantic shell with skip link and landmarks, labelled forms with linked errors, language links, axe checks in E2E
- **Security defaults**: server-side authorization plus RLS, same-origin redirect validation, Zod validation at boundaries, baseline security headers, log redaction
- **Optional Sentry**, disabled unless a DSN is set, with privacy-conservative settings
- **Quality tooling**: Oxlint/Oxfmt (Ultracite presets), Knip, i18n-check, Vitest (Node + browser), Playwright, Lefthook, commitlint, GitHub Actions, Dependabot

Not included on purpose: analytics, consent UI, file uploads, background jobs, email templates, payments or any product domain. See [`docs/decisions/`](docs/decisions/) for how to add them.

## Prerequisites

- Node.js 24+ and npm 11+
- Docker (Docker Desktop on Windows/macOS, or Docker Engine on Linux) for the local Supabase stack
- About 4.5 GB of disk for Supabase images (Postgres and Studio are about 1.7 GB each); the first `npm run db:start` takes a few minutes

## Quick start

```shell
npm ci
cp .env.example .env.local
npm run db:start
npm run dev
```

Open http://localhost:3000. Local services:

| Service | URL |
|---|---|
| App | http://localhost:3000 (`/es` for Spanish) |
| Supabase API | http://127.0.0.1:54321 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (captured auth emails) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

`.env.example` already contains the fixed local Supabase URL and publishable key. If `npm run db:start` prints different values, copy them into `.env.local`.

Stop the stack with `npm run db:stop`.

## Authentication demo

| Route | Purpose |
|---|---|
| `/sign-up` | Create an account. Locally, email confirmation is off, so you are signed in immediately. |
| `/sign-in` | Email and password sign-in |
| `/forgot-password` | Sends a reset link. Locally it appears in Mailpit. |
| `/app` | Protected page: signed-in email and an editable display name stored in `profiles` (RLS) |
| `/app/update-password` | Change password (also the target of reset links) |

All routes also exist under `/es/...`.

**Registration in production is your decision.** The local config allows public sign-up without email confirmation for convenience. For a hosted project, configure in the Supabase dashboard: whether sign-up is allowed, email confirmation, an SMTP provider, CAPTCHA, rate limits and allowed redirect URLs. Hiding the sign-up link does not stop API sign-ups. See [docs/architecture.md](docs/architecture.md#registration-policy-decide-per-product).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server (React Compiler off for speed) |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Generate Next.js route types and run `tsc` |
| `npm run lint` / `npm run lint:fix` | Oxlint (type-aware); `lint:fix` also formats |
| `npm run format` / `npm run format:check` | Oxfmt |
| `npm run check:deps` | Knip: unused files, exports and dependencies |
| `npm run check:i18n` | Missing, unused and undefined translation keys |
| `npm test` | Vitest unit tests (Node) and component tests (headless Chromium) |
| `npm run test:e2e` | Builds and serves the app on port 3008, then runs Playwright E2E and accessibility tests |
| `npm run test:rls` | pgTAP database tests |
| `npm run db:start` / `npm run db:stop` | Start/stop local Supabase |
| `npm run db:reset` | Recreate the local database from migrations (deletes local data) |
| `npm run db:types` | Regenerate `src/types/Database.ts` from the local schema |
| `npm run analyze` | Next.js bundle analyzer |

## Database workflow

```shell
npx supabase migration new add_something   # creates supabase/migrations/<timestamp>_add_something.sql
# edit the SQL: table, RLS policies, explicit grants
npm run db:reset                           # replay all migrations on a fresh local database
npm run test:rls                           # add pgTAP tests in supabase/tests/database/
npm run db:types                           # commit the regenerated types
```

New tables are **not** exposed to the Data API automatically (`auto_expose_new_tables = false`); grant access explicitly in each migration.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Local default in `.env.example` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable (client-safe) key, not the secret key |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL for auth email links, sitemap and robots (default `http://localhost:3000`) |
| `NEXT_PUBLIC_LOGGING_LEVEL` | No | `trace`, `debug`, `info` (default), `warning`, `error`, `fatal` |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Enables Sentry when set |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | No | Build-time source map upload; keep the token secret |

All variables are validated in `src/libs/Env.ts`. `NEXT_PUBLIC_*` values are inlined at build time, so set them before `npm run build`.

## Testing

```shell
npx playwright install chromium   # once, for component and E2E tests
npm test
npm run db:start                  # needed by the next two commands
npm run test:rls
npm run test:e2e
```

E2E tests create throwaway users in the local database and read reset emails from Mailpit. They never contact hosted services.

## Continuous integration

`.github/workflows/CI.yml` runs on pull requests and pushes to `main`, with no repository secrets:

- **Static checks**: commit messages (PRs), typecheck, lint, format, Knip, i18n, `npm audit --audit-level=high`, `npm audit signatures`
- **Unit tests** in Node and headless Chromium
- **Production build**
- **Integration**: local Supabase, RLS tests, generated-types drift check, Playwright (Chromium and Firefox)

Git hooks (Lefthook) check formatting, lint and commit messages on commit, and run typecheck, Knip and i18n checks on push. They never rewrite files.

## Deployment

The app is a standard Next.js Node.js server (`npm run build && npm start`) and works on Vercel or any Node host or container. Before a real launch, complete the product checklist in [ADR-005](docs/decisions/ADR-005-privacy-and-deployment.md): hosted Supabase configuration, environment variables, email delivery, backups, monitoring and a nonce-based CSP.

## Known limitations

- No script/style Content Security Policy yet (needs nonces; see [architecture](docs/architecture.md#security-defaults)).
- Application mutations are not rate limited; Supabase Auth has its own limits.
- Translations are maintained by hand; the Spanish copy has not been reviewed by a native speaker.
- Accessibility is covered by automated axe checks and keyboard tests, not by manual screen reader audits.

## Documentation

- [Architecture](docs/architecture.md): what is implemented and why
- [Decisions](docs/decisions/): starter/child split, uploads, jobs, boundaries, privacy and deployment
- [Starter handoff](docs/starter-handoff.md): verified scope, risks and template publication steps
- [Cleanup audit](docs/cleanup-audit.md): what was removed from the original boilerplate and baseline results
- [AGENTS.md](AGENTS.md): engineering rules

## License and attribution

MIT, see [LICENSE](LICENSE). Derived from [ixartz/Next-js-Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) by Remi W.; keep the license notice in derived projects.
