# 09 — Message hover actions UI

**Chunk:** 2  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** ready-for-agent  
**Blocked by:** 03 — Timeline app  
**Branch:** `agent/messaging-09-message-actions-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Wire **MessageHoverMenu** / **MessageContextMenu**: quote, thread, edit, delete — permission-gated. Edit/delete call APIs from **02**.

**Owns:** hover/context menus on `ConversationMessage`.

**Must not touch:** reaction picker (**08**); quote builder (**04**).

**Consumes:** `EditMessage` / `DeleteMessage` from **02**; quote/thread flows delegate to **05** / **07**.

## Updates (task pack v2)

- **New** explicit ticket (was implicit in archive **03** timeline work).

## API (backend)

_N/A_

## App (frontend)

- [ ] Wire `MessageHoverMenu` / `MessageContextMenu` (quote, thread, edit, delete)
- [ ] Edit flow calls EditMessage; delete calls DeleteMessage
- [ ] Permission-gated actions (own message / canManage rules)

## PR

- [ ] `[messaging 09] Message hover actions UI` — [PR-POLICY.md](../PR-POLICY.md)
