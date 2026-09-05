# 08 — Reactions

**Chunk:** 2  
**Layer:** full  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** done  
**Blocked by:** 02 — Messages API; 03 — Timeline app  
**Branch:** `agent/messaging-08-reactions`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

### API work (backend)

**Required before API criteria:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md) — deep modules at ports/seams per [interfaces.md](../interfaces.md); thin handlers; test through the interface.



## What to build

Toggle reaction on messages — API + timeline UI in one vertical slice (epicstory had full reaction services).

**Owns:** reaction schema/handlers + message reaction chrome.

**Must not touch:** polls (**28**); scheduler.

## Updates (task pack v2)

- **New** in v2 pack (not in archive 16-ticket list). Archive polls/reactions were separate; reactions explicit here.

## API (backend)

- [x] `ToggleReaction` API + `reaction.updated` socket
- [x] Persist aggregates per message + emoji key

## App (frontend)

- [x] Reaction picker / aggregates on `ConversationMessage`
- [x] Realtime update in timeline replica

## PR

- [x] `[messaging 08] Reactions` — [PR-POLICY.md](../PR-POLICY.md)
