# 11 — Typing + presence UI

**Chunk:** 2  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** resolved  
**Blocked by:** 10 — Typing/presence API; 03 — Timeline app  
**Branch:** `agent/messaging-11-typing-presence-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Typing banner near composer; conversation **viewer avatars** in header; workspace **green dots** on **1:1 DMs + member lists** — **not** group DM rows.

**Owns:** header + composer typing/presence UI wiring.

**Must not touch:** message list SQL (**02**); attachments.

**Consumes:** events from **10**.

## Updates (task pack v2)

- **Split from** archive **10**: UI half.

## API (backend)

_N/A_

## App (frontend)

- [x] Typing banner near composer (pulse + TTL)
- [x] Conversation viewer avatars in `ChannelHeader`
- [x] Green dots: 1:1 DM rows + space member lists only (no group DM row dots)

## PR

- [x] [#20](https://github.com/mateusmento/denser/pull/20) `[messaging 11] Typing + presence UI` — open, awaiting review
