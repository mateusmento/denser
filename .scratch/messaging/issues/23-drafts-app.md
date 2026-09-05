# 23 — Composer draft sync UI

**Chunk:** 4  
**Layer:** app  
**Domain:** [MESSAGE-DRAFTS.md](../../../docs/MESSAGE-DRAFTS.md)  
**Status:** done  
**Blocked by:** 22 — Drafts API; 03 — Timeline app  
**Branch:** `agent/messaging-23-drafts-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Composer **hydrates from server** on open (main + thread); debounced upsert; **409 → replace editor** with server draft; clear on successful send. Coordinate thread draft key with **07**.

**Owns:** draft composable + `MessageComposer` / thread composer wiring.

**Must not touch:** attachment tiles (**19** — upload can use ensureDraft from **22** before this lands).

**Consumes:** draft APIs from **22**.

## Updates (task pack v2)

- **Split from** archive **08**: UI half. Coordinate with **07** when both land — thread draft key includes `thread_id`.

## API (backend)

_N/A_

## App (frontend)

- [x] Hydrate composer on open (main + thread)
- [x] Debounce upsert (~300–500ms)
- [x] 409 → replace editor with server draft (server wins)
- [x] Clear local state on successful send
- [x] No dual-write localStorage SoT

## PR

- [x] `[messaging 23] Composer draft sync UI` — [PR-POLICY.md](../PR-POLICY.md)
