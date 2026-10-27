# AGENTS

Engineering rules for humans and AI agents working in this repository. Architecture: `docs/architecture.md`. Decisions: `docs/decisions/`.

## Principles
- Clarity and consistency over cleverness. Minimal changes. Match existing patterns.
- Prefer deletion over abstraction. No speculative modules, empty folders or wrappers without consumers.
- Keep components/functions short; break down when it improves structure.
- TypeScript everywhere; no `any` unless isolated and necessary. Avoid casting; use narrowing or Zod parsing.
- No unnecessary `try/catch`.
- Named exports only (no default exports, except Next.js pages, layouts and config files).
- Absolute imports via `@/` unless same directory.
- Let the compiler infer return types unless an annotation adds clarity.
- Options object for 3+ params, optional flags, or ambiguous args.
- Hypothesis-driven debugging: 1-3 causes, validate the most likely first.
- Next.js 16 differs from older versions (for example `proxy.ts` replaces `middleware.ts`). Check `node_modules/next/dist/docs/` or the official docs before relying on memory.

## Commands
npm is the only package manager (`package-lock.json`). Use these scripts:
- `dev`, `build`, `start`
- `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `check:deps`, `check:i18n`
- `clean`, `check` (all static checks), `verify` (full local CI-equivalent)
- `test`, `test:db`, `test:e2e`, `test:rls`, `test:storybook`
- `storybook`, `build-storybook`
- `db:start`, `db:stop`, `db:reset`, `db:generate`, `db:migrate`, `check:migrations`

## Git commits
Conventional Commits: `type: summary` without scope. The summary is a short, specific sentence that explains what changed and where or why. Types: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`. Add a `BREAKING CHANGE:` footer when needed.

## Env
- All env vars are validated in `src/libs/Env.ts`; never read `process.env` directly elsewhere.
- Document every variable in `.env.example`. Never commit real secrets; `.env*` files other than `.env.example` are git-ignored.
- Only `NEXT_PUBLIC_*` values may reach the browser. `DATABASE_URL` is a server-only secret. The app does not use the Supabase secret/service-role key; if a feature needs it, keep it in a server-only module and document why.

## Supabase and data
- Tables and RLS policies are defined with Drizzle in `src/models/Schema.ts` (`pgPolicy`, `authUid`, `authenticatedRole` from `drizzle-orm/supabase`). `npm run db:generate -- --name=<change>` writes SQL into `supabase/migrations/`; the Supabase CLI applies it (`npm run db:migrate`, or `npm run db:reset` from scratch). Never edit an applied migration; add a new one.
- Grants, triggers and extensions go in custom migrations (`npm run db:generate -- --custom --name=<change>`). New tables are not auto-exposed: grant explicitly.
- Every table needs RLS and pgTAP tests in `supabase/tests/database/` covering anonymous, owner and cross-user access.
- App queries go through `withRls(claims, (tx) => …)` from `@/libs/DB`, which runs them as `authenticated` with the verified claims. Never query the privileged connection directly. Log `getDatabaseErrorCode(error)`, never Drizzle error messages (they embed query parameters).
- Avoid `security definer` functions; if unavoidable, set `search_path = ''` and keep them narrow.
- After schema changes: `npm run db:reset`, `npm run test:rls`, `npm run test:db`, and commit the migration plus `supabase/migrations/meta/`.

## Auth and security
- Use `getClaims()` (via `requireUserClaims()`) for authorization; never trust `getSession()` on the server.
- Check the user in every protected page **and** every Server Action/Route Handler. The proxy only refreshes sessions; hiding UI is not authorization. RLS is the final guard.
- Validate all request input with Zod at the boundary (Server Actions, Route Handlers).
- Redirect targets from user input go through `getSafeRedirectPath()`.
- Do not reveal whether an account exists in auth error messages.
- Log error codes and IDs, never passwords, tokens, cookies, emails or request bodies.

## Styling and accessibility
- Tailwind v4 utility classes on native elements. Reuse shared components (`ActionForm`, `BaseTemplate`). Responsive. No unnecessary classes or design-system scaffolding.
- One `h1` per page, labelled landmarks, visible labels for inputs, `aria-invalid`/`aria-describedby` for errors, visible focus. Controls must not change context on input (no auto-navigating selects).
- Add or extend axe checks in `tests/e2e/A11y.e2e.ts` for new pages.

## React
- Write plain, pure components; the React Compiler (enabled in production builds) handles memoization. Add `useMemo`/`useCallback` only when profiling shows a need.
- Use `useEffect` only to synchronize with external systems, not to derive state or respond to events.
- React Hook Form: read `formState` fields (e.g. `const { errors } = form.formState`) at the top of the component. Reads nested in callbacks go stale under the React Compiler. Share Zod schemas with Server Actions via `FormValidations`; the server always re-validates.
- Single `props` param with inline type; access as `props.foo` (no destructuring).
- Use `React.ReactNode`, not `ReactNode`.
- Inline short event handlers; extract only when complex.

## Pages
- Default export name ends with `Page`. Props alias (if reused) ends with `PageProps`.
- Locale pages: `props: { params: Promise<{ locale: string }> }` → `await props.params` → `setRequestLocale(locale)`.
- Escape glob chars in shell commands for Next.js paths (for example `src/app/\[locale\]`).
- Protected pages live under `src/app/[locale]/app/`; define their metadata once in the layout.

## i18n (next-intl)
- Never hard-code user-visible strings. Add keys to both `src/locales/en.json` and `es.json`.
- Page namespaces end with `Page`. Use static keys (`t('key')`) so `check:i18n` can see them.
- Server: `getTranslations`; Client: `useTranslations`.
- Context-specific keys (`card_title`, `meta_description`). Use `t.rich(...)` for markup.
- Use sentence case. Error messages are short, with no "try again" variants.

## JSDoc
- Start each block with `/**` directly above the symbol.
- Short, sentence-case, present-tense description of intent.
- Order: description → `@param` → `@returns` → `@throws` (only if it can throw).

## Tests
- `*.test.ts(x)` for unit/component tests, `*.db.test.ts` for tests against the local database and `*.stories.tsx` for shared components, co-located with the implementation. Stories run as tests (play functions and axe); give them realistic labels and messages. `*.e2e.ts` for Playwright tests in `tests/e2e/`. SQL RLS tests in `supabase/tests/database/`.
- Top `describe` = subject; nested `describe` to group scenarios or contexts.
- `it` titles: short, third-person present, `verb + object + context`. Sentence case, no period.
- Omit "should/works/handles/checks/validates". State what, not how.
- Avoid mocking unless necessary. E2E tests run against local Supabase; never against hosted projects.
