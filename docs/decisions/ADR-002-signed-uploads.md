# ADR-002: Media uploads with signed upload URLs

- **Status:** Accepted design for child projects. **Not implemented** in the starter: no buckets, endpoints, upload UI, media tables or workers exist.
- **Date:** 2026-10-27

## Context

Products will need user-uploaded media. Proxying file bytes through Next.js server functions wastes compute, hits body-size limits and complicates scaling.

## Decision

Use **Supabase Storage signed upload URLs** so browsers upload directly to Storage after a trusted server authorizes each upload.

1. The authenticated browser asks the server to upload a file of a given category, declared type and size.
2. A trusted server entry point (Server Action or Route Handler) verifies the user (`getClaims()`), category rules, size and type limits, quota/rate policy, and **chooses** a unique object path (for example `<user-id>/<uuid>`; never a client-supplied path and never overwriting). It then calls `storage.from(bucket).createSignedUploadUrl(path)` (or the current equivalent) and returns the token/URL.
3. The browser uploads with `uploadToSignedUrl` (or a compatible resumable method).
4. A separate **finalize** step verifies that the object exists and that its real size/type match, then records lifecycle state (for example `pending → validated → published`) in a product table protected by RLS. Holding a signed token is never permission to publish.
5. Where content must be validated or transformed, uploads go to a **private staging** bucket. Server-side processing (magic-byte type check, malware scanning policy, metadata/EXIF stripping, resizing/variants) runs before copying to a published location. Heavy processing runs in a Node runtime or job (see ADR-003), not in an Edge function.
6. Reads of private media use RLS-protected access or short-lived signed **download** URLs, which are separate from upload URLs. Buckets also enforce `file_size_limit` and `allowed_mime_types` as defence in depth.
7. Signed upload tokens are bearer capabilities: never log them, send them to analytics or cache responses containing them. Browser-side size/type checks are only UX.
8. Abandoned uploads (signed but never finalized) are cleaned up by a scheduled job after the URL expires.

## Notes for implementation

- At the time of writing, Supabase documents signed upload URLs as valid for **2 hours** and usable "without further authentication". Re-check the live SDK reference before implementing; do not hard-code the duration.
- The local `supabase/config.toml` currently disables Storage; enable it in the child project.

## Consequences

- Upload bandwidth never touches the app server.
- Every published object has an explicit, auditable lifecycle and owner.
- Requires a finalize step and a cleanup job, which the child project must build and test (including RLS tests for media tables).
