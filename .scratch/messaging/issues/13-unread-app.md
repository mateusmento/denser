# 13 — Unread UI

**Chunk:** 2  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** ready-for-agent  
**Blocked by:** 12 — Unread API; 03 — Timeline app  
**Branch:** `agent/messaging-13-unread-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Slack-like **New** divider, badge counts, open-with-unread lands near divider (`around` first unread), **mark-read-to-latest on open**. Jump pill when scrolled off live edge (wire to **03** state).

**Owns:** badges + divider + open/land behavior.

**Must not touch:** schedule UI (**26**); read_state SQL (**12**).

**Consumes:** unread APIs from **12**; jump pill from **03**.

## Updates (task pack v2)

- **Split from** archive **12**: UI half.

## API (backend)

_N/A_

## App (frontend)

- [ ] Sidebar/header badge counts from unread summary
- [ ] **New** divider between last-read and first unread in timeline
- [ ] Open with unread → `around` first unread; caught up → pin latest
- [ ] Mark-read-to-latest on open (debounced OK)
- [ ] Jump-to-latest pill when scrolled away from live edge

## PR

- [ ] `[messaging 13] Unread UI` — [PR-POLICY.md](../PR-POLICY.md)
