# ADR-004: Modular monolith boundaries

- **Status:** Accepted. The current code follows these rules; feature folders are **not created** until real features exist.
- **Date:** 2026-10-27

## Context

The starter must stay small while preventing early structural decisions that are expensive to undo, such as UI-driven authorization or business logic inside components.

## Decision

1. Next.js App Router + Supabase form a single deployable **modular monolith**. No microservices, custom backend server or separate API gateway.
2. Rendering components do not contain business rules. They read data and render it.
3. **Authorization is enforced at the server and database boundary**: every protected page and Server Action checks the user, and RLS restricts every table exposed to the Data API. Hiding UI is never authorization.
4. Server Actions and Route Handlers are **adapters**: they validate input (Zod), authenticate, then call domain code. As domains grow, move domain logic out of the adapter into plain functions that can be tested without Next.js.
5. Privileged database access (service-role/secret key) is server-only and avoided by default. If a feature truly needs it, isolate it in a dedicated server module, document why, and keep RLS as the default path.
6. Create **feature folders when real features appear** (for example `src/features/<feature>/` with its actions, queries, components and tests). Do not pre-create `events`, `communities`, `media`, `jobs`, `matching`, `notifications` or similar empty modules.
7. Prefer TypeScript contracts and SQL transactions/constraints over speculative service boundaries.

## Consequences

- One codebase and one deployment to operate.
- Boundaries are enforced by convention, code review and RLS tests rather than by network hops.
