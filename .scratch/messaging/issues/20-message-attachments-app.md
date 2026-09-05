# 20 — Message attachment render (timeline)

**Chunk:** 3d — In timeline  
**Layer:** app  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) · [ui-surfaces/conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** resolved  
**Blocked by:** 17 — Attachment refs; 03 — Timeline app  
**Branch:** `agent/messaging-20-message-attachments-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

Render **delivered** attachments in `ConversationMessage`: inline images via TipTap/RichTextPreview, non-image files as download tiles, optional lightbox/open. Message list API already returns `attachmentIds` / hydrated metadata (from 02 + 17).

**Owns:** `ConversationMessage` attachment regions; image node display; file chip component if needed.

**Must not touch:** Upload flow (19); files pane chrome (21); PostMessage sync (17/02).

## Updates (task pack v2)

- **New** in v2 — archive combined upload + display; timeline render is explicit **20**.

## API (backend)

_N/A — may add getUrl client helper only._

## App (frontend)

- [ ] Inline images render from attachment URL / stable app route
- [ ] Non-image attachments: filename, size, mime icon, open/download
- [ ] Deleted/unavailable attachment: graceful placeholder
- [ ] Works in main stream and thread pane (07)
- [ ] Storybook update for message with attachments

## Reviewer notes

After **19 + 20** you can upload and **see** files in chat. Files pane (21) is separate browse UX.

## PR

- [ ] `[messaging 20] Message attachment render` — [PR-POLICY.md](../PR-POLICY.md)
