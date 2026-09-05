# 03 — Timeline app (virtualized window + send)

**Chunk:** 1  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** ready-for-agent  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-03-timeline-app`  
**Specs:** [FRONTEND-ARCHITECTURE.md](../../../docs/FRONTEND-ARCHITECTURE.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Wire existing **presentational** timeline/composer to real API: virtualized **sliding window**, optimistic send, day/author groups, jump-to-latest pill. Users can open a conversation, scroll, and send TipTap text.

**Owns:** `useConversationMessages` (or extend sync); timeline + composer send wiring.

**Must not touch:** quote card UI (**05**), ThreadPane (**07**), attachment tiles (**19**), hover menu (**09** — can land in parallel).

**Consumes:** `ListMessages` + sockets from **02**; presentational components in `packages/app/src/features/conversation/presentationals/`.

## Updates (task pack v2)

- **Split from** archive **03**: app half of old list/send/window ticket.
- Message hover actions moved to dedicated **09** (not in archive).

## API (backend)

_N/A_

## App (frontend)

- [ ] `useConversationMessages` binds ListMessages + socket replica
- [ ] Virtualized sliding window (`next`/`prev`/`around`); bounded pages — not unbounded DOM
- [ ] Optimistic send reconciles by `clientId`
- [ ] Day sticky + same-author / 5 min groups (`messageGrouping.ts`)
- [ ] Jump-to-latest floating pill (Floating UI); visibility tied to live-edge / `hasMoreNewer`
- [ ] Wire `ConversationTimeline` + `MessageComposer` send (text only OK for this PR)

## PR

- [ ] `[messaging 03] Timeline app (virtualized window + send)` — [PR-POLICY.md](../PR-POLICY.md)
