# 15 — Conversation shell gaps

**Chunk:** 2  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** ready-for-agent  
**Blocked by:** 14 — DM peers API (optional: parallel with stubs)  
**Branch:** `agent/messaging-15-conversation-shell-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Sidebar **hide DM** UX; soft-archive conversation chrome if not already in shell; verify create/open DM flows use peer APIs from **14**.

**Owns:** shell/sidebar conversation chrome for DM preferences.

**Must not touch:** peer migration internals (**14**); message list.

**Consumes:** hide/unhide APIs from **14**.

## Updates (task pack v2)

- **Split from** archive **13**: app half (hide preference UI). Archive had no separate shell ticket.

## API (backend)

_N/A_

## App (frontend)

- [ ] DM hide from sidebar (per-user preference)
- [ ] Soft-archive conversation UI if not in shell
- [ ] Verify create/open DM flows call peer APIs

## PR

- [ ] `[messaging 15] Conversation shell gaps` — [PR-POLICY.md](../PR-POLICY.md)
