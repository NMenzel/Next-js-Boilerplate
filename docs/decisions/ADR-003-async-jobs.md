# ADR-003: Asynchronous jobs

- **Status:** Accepted design for child projects. **Not implemented** in the starter: no queues, workers, cron jobs or outbox tables exist.
- **Date:** 2026-10-27

## Context

Products will need work outside the request/response cycle: media processing, emails, notifications and periodic cleanup. The starter has no such work, so adding infrastructure now would be speculative.

## Decision

1. When real background work appears, use **Supabase Queues** (Postgres-native, built on the `pgmq` extension) as the first durable queue. At implementation time, verify plan availability, local CLI support, retention and throughput limits.
2. No Redis, BullMQ or separately deployed worker until a real workload proves the Postgres queue insufficient.
3. Each job type must define:
   - identity and an **idempotency key**, so re-delivery is harmless;
   - retry with backoff, a maximum attempt count and a dead-letter/failed state;
   - visibility timeout appropriate to its runtime;
   - concurrency limits;
   - observability (structured logs with job ID, failure alerts) and cleanup/archival.
4. When a database change must trigger async work, use a **transactional outbox** (or enqueue in the same Postgres transaction, which pgmq allows), so work is never lost or sent for rolled-back data.
5. Never use a queue as a substitute for an atomic transaction. Registrations, payments, inventory and capacity checks must be correct inside a single SQL transaction; jobs only handle follow-up effects.
6. Job handlers are plain functions callable independently of React components and route handlers, so they can run from a worker, a scheduled function or a test.
7. CPU-heavy work (for example image transformation) does not run in Edge runtimes. Use a Node worker or a managed media service when requirements justify it.

## Consequences

- One operational dependency (Postgres) for data and jobs at the start.
- Job contracts are designed with the first real job, including tests for retries and idempotency.
