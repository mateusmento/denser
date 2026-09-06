# 28 — Polls

**Chunk:** 6  
**Layer:** full  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** claimed  
**PR:** [#32](https://github.com/mateusmento/denser/pull/32) (rebased onto `main` — run `pnpm db:migrate` for `0014_message_poll.sql`)  
**Blocked by:** 02 — Messages API; 03 — Timeline app  
**Branch:** `agent/messaging-28-polls`  
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

Poll embed **create/vote** as a separate messaging-cut slice: composer insert + message embed. Keep domain minimal; align contracts in-PR if needed.

**Owns:** poll schema + API + composer poll insert + message poll render.

**Must not touch:** scheduling; attachments graph (unless poll has no files).

**Consumes:** message post from **02**; composer action row from presentational shell.

## Updates (task pack v2)

- **Renumbered** from archive **15** (polls). Spec was thinner in archive — expand contracts in PR if needed; do not block attachments/schedule.

## API (backend)

- [ ] CreatePoll / VotePoll API + embed on message
- [ ] Vote updates; realtime optional (`message.updated` or poll-specific event)

## App (frontend)

- [ ] Composer poll insert (action row)
- [ ] Poll embed render + vote in timeline

## PR

- [x] `[messaging 28] Polls` — [#32](https://github.com/mateusmento/denser/pull/32)
