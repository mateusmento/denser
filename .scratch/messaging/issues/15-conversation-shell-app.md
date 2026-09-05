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

**DM placement (product):** direct conversations belong to a **private root space** — listed in the sidebar **Direct messages** section whenever the user is inside that workspace (any nested space or artifact). Sidebar labels are **peer-relative** (1:1 shows the other person’s name; not a fixed artifact title). Group DMs show combined title; no presence dot on group rows. Only **conversation members** may access a DM. DMs never appear on global Home.

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
- [ ] DMs only in root-space sidebar (not Home gallery / nav artifacts)
- [ ] Peer-relative DM labels for all members (not creator-static titles)

## PR

- [ ] `[messaging 15] Conversation shell gaps` — [PR-POLICY.md](../PR-POLICY.md)
