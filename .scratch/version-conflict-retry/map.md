# Version-conflict retry policy (command layer)

## Destination

A written decision on **when** versioned PATCH operations outside sync composables should bounded-retry on 409, plus whether to extract a shared helper — so command-layer moves/renames/planning patches behave consistently and `moveArtifact` doesn’t carry ad-hoc loops.

**Status:** destination reached (2026-09-06).

## Notes

- **Domain:** frontend concurrency / artifact commands
- **Skills:** [`frontend-patterns/references/conflict-version.md`](../../.cursor/skills/frontend-patterns/references/conflict-version.md), [`codebase-design`](../../.cursor/skills/codebase-design/SKILL.md)

## Decisions so far

- [01 — Investigate command-layer 409 retry policy](./issues/01-investigate-command-layer-409-retry.md) — **Command-layer versioned PATCH bounded-retries (2 attempts, dumb merge); `patchWithVersionRetry` + `artifactPatchConflictVersion` in app lib; wired through `useArtifactCommands` and `useSpaceSync`; sync composables unchanged.**

## Not yet specified

- Same-field move UX if two users pick different destinations — toast-only for v1 (accepted)

## Out of scope

- Spaces (`patchSpace` has no `version` field)
- CRDT / per-field versioning alternatives
- Server-side change to 409 semantics
- Sharing retry helper with `useDocumentSync` / `useConversationSync` (field merge stays bespoke)
