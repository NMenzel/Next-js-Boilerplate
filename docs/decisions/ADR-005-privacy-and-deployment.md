# ADR-005: Privacy, analytics and deployment are product decisions

- **Status:** Accepted. Analytics, consent and production deployment are **not implemented** in the starter.
- **Date:** 2026-10-27

## Context

The upstream boilerplate advertised PostHog and other services without a real product or consent model. A generic starter has no meaningful product events and no legal basis to track anyone.

## Decision

### Analytics and privacy

1. The starter ships **no analytics SDK, event capture, user identification, session replay or consent banner**. Sentry, when enabled, does not collect cookies, headers, bodies, query parameters or user info, and has no replay.
2. A child product designs analytics together with its purposes and legal basis: event taxonomy, consent categories, retention, deletion/export (data subject requests), user reporting and data processing agreements. PostHog EU Cloud is a candidate for products serving EU users; choose and configure it in the child project.
3. Behaviour-based features (recommendations, matching) need their own privacy review before collecting data.
4. The starter documents security and privacy responsibilities but does **not** claim GDPR or any other compliance certification.

### Deployment

1. Runtime and docs stay provider-neutral: the app is a standard Next.js Node.js server (`npm run build && npm run start`). Vercel works, as do other Node hosts and containers. Do not use static export; keep Node runtime compatibility for future server libraries.
2. Production launch tasks owned by the child project:
   - a hosted Supabase project (region, plan, auth settings, signing keys, redirect URLs, SMTP, CAPTCHA, rate limits, `auto_expose_new_tables` disabled, migrations applied via CI or `supabase db push`);
   - environment variables per environment (`.env.example` lists them) and secret management;
   - production email delivery, plus the confirmation and recovery templates from `supabase/templates/` (the app's email links depend on them);
   - backups and restore drills for the database **and Storage objects**;
   - quotas/cost alerts, uptime and error monitoring, incident response;
   - security headers review and a nonce-based CSP.
3. The starter itself is never deployed and incurs no hosted costs.

## Consequences

- No tracking happens until a product deliberately adds it with consent and documentation.
- Each child project must complete its launch checklist; the starter provides the hooks (env validation, optional Sentry, Node runtime) but not the decisions.
