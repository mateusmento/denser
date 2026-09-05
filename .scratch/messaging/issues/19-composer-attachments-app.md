# 19 — Composer upload UI (tiles, progress, cancel)

**Chunk:** 3c — Compose & upload (**main attachment UI**)  
**Layer:** app  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) · [ui-surfaces/conversation.md](../../../docs/ui-surfaces/conversation.md)  
**Status:** claimed  
**Blocked by:** 18 — Upload API; 03 — Timeline app; 23 — Drafts app (or stub: hydrate without debounce if 23 not merged)  
**Branch:** `agent/messaging-19-composer-attachments-app`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before App work:** read [frontend-patterns](../../../../.cursor/skills/frontend-patterns/SKILL.md).

- Wire existing presentationals in `packages/app/src/features/conversation/presentationals/` — **do not rebuild** chrome from scratch.
- Presentational/container split; sync composables in containers only ([presentational-container](../../../../.cursor/skills/frontend-patterns/references/presentational-container.md)).
- TanStack Query + DB for message replica; 409 merge-retry for drafts ([composables](../../../../.cursor/skills/frontend-patterns/references/composables.md), [async-ux](../../../../.cursor/skills/frontend-patterns/references/async-ux.md)).
- Add/update **Storybook** stories for touched presentationals (`features/conversation/stories/`).

## What to build

**This is the upload UI ticket.** Wire `MessageComposer` so users can **add files/images**, see **upload progress**, **cancel** in-flight uploads, **remove** tiles before send, and **send attachment-only** messages (empty TipTap OK). Uses draft anchor staging: tiles = draft joins − inline TipTap image ids.

Reference: epicstory `message-composer-attachments.ts`, `message-composer-attachment-handlers.ts`, `use-message-composer-core.ts`.

**Owns:** `packages/app` composer attachment state, upload client, tile strip UI, drop/paste integration with rich-text-composer FileHandler, send/schedule attachmentId union.

**Must not touch:** BlobStore server adapters (16); S3 SDK in API (18 only via HTTP); files pane (21).

**Depends on:** 18 for upload HTTP; 03 for send path; 23 for draft hydrate (server wins on 409).

## Updates (task pack v2)

- **New** in v2 — archive had no separate upload API ticket (was implied by blobstore + refs).

## API (backend)

_N/A — consumes 18._

## App (frontend)

- [x] **Insert attachment** action row + drop/paste files → calls upload API
- [x] **Tile strip** under/beside composer: filename, thumb for images, **progress %**, **Cancel** while uploading
- [x] **Remove tile** before send → sync draft anchor (not `releaseAttachment` unless intentional destroy)
- [x] **Inline images** in TipTap: `attachmentId` on image node; tiles exclude ids already in doc (`joins − doc`)
- [x] **Send** passes union(tile ids ∪ inline image ids) to PostMessage
- [x] **Attach-only send**: Send enabled when tiles exist but body empty
- [x] Failed upload: inline error on tile + retry; cancel leaves no orphan UI state
- [x] Storybook or manual test notes in PR body

## Reviewer notes

**First PR where you can upload in the product UI.** Pair with 03 (send) for E2E. Message display of files is ticket **20**.

## PR

- [x] [#19](https://github.com/mateusmento/denser/pull/19) `[messaging 19] Composer upload UI` — open, awaiting review
