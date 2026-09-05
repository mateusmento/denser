# 21 — Conversation files pane

**Chunk:** 3e — Files pane  
**Layer:** full  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) A3  
**Status:** ready-for-agent  
**Blocked by:** 17 — Attachment refs  
**Branch:** `agent/messaging-21-files-pane`  
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

Slack-like **“files shared in this conversation”** pane: list **delivered** attachments (message joins), open/download, **delete** with confirm (`releaseAttachment` — destroys all joins). API + UI in one PR (small vertical slice).

**Owns:** `listDeliveredForConversation` route if missing; conversation details / files tab UI.

**Must not touch:** Composer upload (19); scheduler (25).

## Updates (task pack v2)

- **Renumbered** from archive **14** (files pane). Was full-stack in archive; still full in v2.

## API (backend)

- [ ] `GET /conversations/:id/attachments` — delivered only
- [ ] `DELETE` → `releaseAttachment` + confirm semantics server-side

## App (frontend)

- [ ] Files list in conversation chrome (tab or section per ui-surfaces)
- [ ] Row: name, uploader, date, size; click opens/downloads
- [ ] Delete → confirm dialog → removes file everywhere
- [ ] Empty state when no delivered files

## Reviewer notes

Optional polish after core upload (19+20). Chunk 3 “messaging complete” does **not** require 21.

## PR

- [ ] `[messaging 21] Conversation files pane` — [PR-POLICY.md](../PR-POLICY.md)
