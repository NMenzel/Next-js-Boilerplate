# ADR-001: Starter and child projects

- **Status:** Accepted. Process decision; publication steps are **not yet performed**.
- **Date:** 2026-10-27

## Context

This repository was cleaned from a fork of `ixartz/Next-js-Boilerplate` (MIT) to serve as a reusable, product-neutral starter. Products will be built in separate repositories created from it.

## Decision

1. The starter stays independent of any product, market or brand. Product requirements never land here.
2. Each product is a **new repository created from the starter template**, not a branch or fork of the starter.
3. The child project owns its product schema, registration policy, analytics/consent model, storage configuration, email delivery and deployment.
4. Prefer a **standalone template repository**. A GitHub template copies the files of the default branch into a new repository with unrelated history; a fork keeps a network relationship and pull-request defaults towards the upstream.
5. Keep the MIT `LICENSE` and its copyright notice in the starter and every derived repository.
6. Updates from the upstream boilerplate or from the starter into child projects are deliberate, reviewed ports, never automatic merges (template histories are unrelated, so merges are impossible anyway).

## Publication options (require owner approval)

The current repository is a public fork that already reports `isTemplate: true`.

- **A. Use the fork as the template.** No destructive steps: merge the cleanup branch into `main`, then create child repositories with *Use this template* (or `gh repo create <name> --template <owner>/<repo>`). Downside: the template remains in the upstream fork network ("forked from ixartz/…").
- **B. Leave the fork network (recommended for long-term ownership).** In *Settings → General → Danger Zone → Leave fork network*. Requires a public fork under 1 GB without child forks. It is permanent; the repository loses issues, pull requests, stars and watchers, keeps commit history, and can never rejoin the network.
- **C. New standalone repository.** Create an empty repository, push the cleaned `main` (`git push <new-remote> chore/reusable-starter-cleanup:main`), then enable *Settings → Template repository*. The fork can stay or be archived separately. This keeps history without touching the fork.

Template limitations: Git LFS files are not supported in templates; branches other than the default are only copied if the creator opts in.

## Consequences

- Child projects start with the starter's history squashed into a single initial commit (template behaviour) and diverge freely.
- Starter improvements must be ported to child projects manually.
