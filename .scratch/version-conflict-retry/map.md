# Version-conflict retry policy (command layer)

## Destination

A written decision on **when** versioned PATCH operations outside sync composables should bounded-retry on 409, plus whether to extract a shared helper — so command-layer moves/renames/planning patches behave consistently and `moveArtifact` doesn’t carry ad-hoc loops.

## Notes

- **Domain:** frontend concurrency / artifact commands
- **Skills:** [`frontend-patterns/references/conflict-version.md`](../../.cursor/skills/frontend-patterns/references/conflict-version.md), [`codebase-design`](../../.cursor/skills/codebase-design/SKILL.md)
- **Not blocking** current gallery conversation-move work; revisit when touching command-layer PATCH paths again

## Decisions so far

- [01 — Investigate command-layer 409 retry policy](./issues/01-investigate-command-layer-409-retry.md) — **Command-layer versioned PATCH should bounded-retry (dumb merge, ~2 attempts); sync composables keep rich merge; extract `patchWithVersionRetry` in app lib; align `useSpaceSync` moves with gallery commands; spaces stay unversioned.**

## Not yet specified

- Exact `maxAttempts` for commands (2 vs 3) — lean 2
- Same-field move UX if two users pick different destinations — toast-only for v1
- Implementation ticket file (spawn when ready to execute)

## Out of scope

- Spaces (`patchSpace` has no `version` field)
- CRDT / per-field versioning alternatives
- Server-side change to 409 semantics
