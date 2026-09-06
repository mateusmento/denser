# 32 — Release attachments on message delete

**Chunk:** 3d — Attachments lifecycle  
**Layer:** api  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) · [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** claimed  
**PR:** [#28](https://github.com/mateusmento/denser/pull/28) (open — mergeable)  
**Blocked by:** 02 — Messages API; 17 — Attachment refs  
**Branch:** `agent/messaging-32-delete-message-attachment-release`  
**Specs:** [interfaces.md](../interfaces.md) · [CHUNKS.md](../CHUNKS.md)

## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Extend the **messages** domain service at the existing seam — do not add attachment logic to HTTP handlers.
- Use **AttachmentReferences** (`commit` / `release`) per [interfaces.md](../interfaces.md); no direct `message_attachment` deletes outside the attachments module.
- **Test through the interface** — integration test: post message with attachment → delete message → joins gone → blob eligible for reclaim.

## Problem

`DeleteMessage` is a **soft delete** (`deleted_at` set) but **does not release** the message attachment anchor. Today:

- Timeline hides the message (client filters `deletedAt`; files pane excludes deleted messages).
- `message_attachment` joins and blob rows **remain** — refcount never drops, so storage is not reclaimed.

Per [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md): composer edit-remove uses `sync`; destroying a file's joins uses `release` / `releaseAttachment`. Message delete should **`release` the message anchor** (drop all joins for that message id) so unreferenced blobs can GC after grace.

## What to build

In `deleteMessage` (after successful soft delete):

1. `commit({ op: 'release', anchor: { type: 'message', messageId } })` via `MessageAttachmentCoordinator` / `attachmentReferences`.
2. Emit socket `deleted` event **after** release (DTO may still include attachment metadata for tombstone clients, or strip — match existing mapper).
3. Do **not** call `releaseAttachment` per id unless product requires hard destroy of shared blobs (v1: release anchor only).

**Owns:** `packages/api/src/domains/messages/service.ts` delete path; attachment coordinator wiring if missing; tests.

**Must not touch:** files pane UI (21); timeline filter (03); reclaim cron internals (17).

## API (backend)

- [ ] `deleteMessage` releases message attachment anchor
- [ ] Integration test: message + attachment → delete → zero `message_attachment` rows for that message
- [ ] Shared attachment on two messages: delete one message drops only that message's join (not `releaseAttachment` on the blob)
- [ ] Reclaim path can delete blob after grace when refcount hits 0 (extend 17 integration test or add focused case)

## App (frontend)

_N/A — behavior is server-side. Optional: verify deleted messages with attachments stay hidden (already true)._

## Reviewer notes

Distinct from **21** files-pane **intentional delete** (`releaseAttachment` — strips all joins everywhere). This ticket is **message soft-delete hygiene**: drop joins for the deleted message anchor only.

## PR

- [x] `[messaging 32] Release attachments on message delete` — [#28](https://github.com/mateusmento/denser/pull/28)
