# 05 — Quote card UI + jump

**Chunk:** 2  
**Layer:** app  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** ready-for-agent  
**Blocked by:** 04 — Quotes API; 03 — Timeline app  
**Branch:** `agent/messaging-05-quotes-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Quote preview chrome in timeline; click → `around` jump with around-focus scroll ownership until user returns to live edge.

**Owns:** quote card in `ConversationMessage`; jump interaction.

**Must not touch:** preview builder (**04**); core list handler (**02**).

**Consumes:** enriched `quoted` from **04**; `around` from **03**.

## Updates (task pack v2)

- **Split from** archive **04**: UI half of quote + jump ticket.

## API (backend)

_N/A_

## App (frontend)

- [ ] Quote preview in `ConversationMessage` (`max-h-40` + gradient on overflow)
- [ ] Click quote → `around` recenter; around-focus owns scroll until live edge
- [ ] `RichTextPreview` on joined quote body

## PR

- [ ] `[messaging 05] Quote card UI + jump` — [PR-POLICY.md](../PR-POLICY.md)
