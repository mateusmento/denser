# 07 — ThreadPane UI

**Chunk:** 2  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** ready-for-agent  
**Blocked by:** 06 — Threads API; 03 — Timeline app  
**Branch:** `agent/messaging-07-threads-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Reply in thread; **ThreadPane** lists thread messages. Desktop **split + resize + fade**; small viewport **full-replace + fade**. Thread list does not share main around-focus window.

**Owns:** ThreadPane container + thread composer wiring.

**Must not touch:** main timeline virtualization core (**03**); drafts server (**22** — thread draft key includes `thread_id` when **23** lands).

**Consumes:** thread APIs from **06**; `PostMessage` from **02**.

## Updates (task pack v2)

- **Split from** archive **05**: UI half. Coordinate composer draft key with **23**.

## API (backend)

_N/A_

## App (frontend)

- [ ] Open thread from message action loads thread messages
- [ ] Desktop: split + resize + fade-in; mobile: full-replace + fade-in
- [ ] Thread composer posts with `threadId`
- [ ] Thread list separate from main around-focus / jump state

## PR

- [ ] `[messaging 07] ThreadPane UI` — [PR-POLICY.md](../PR-POLICY.md)
