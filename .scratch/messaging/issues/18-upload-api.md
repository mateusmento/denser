# 18 — Conversation upload API

**Chunk:** 3b — Upload API (backend)  
**Layer:** api  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) · [MESSAGE-DRAFTS.md](../../../docs/MESSAGE-DRAFTS.md)  
**Status:** claimed  
**Blocked by:** 16 — BlobStore; 17 — Attachment refs; 22 — Drafts API  
**Branch:** `agent/messaging-18-upload-api`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

HTTP API for **uploading files into a conversation**: start progressive upload, report progress (or session polling), **abort/cancel**, and attach blob to **draft anchor** via `ensureDraft` + `sync`. This enables ticket **19** (composer upload UI). Still **no Vue in this PR** — verify with curl/Postman or API tests.

**Owns:** `POST /conversations/:id/attachments` (+ optional `threadMessageId`); abort endpoint; server-side ensureDraft + join sync.

**Must not touch:** Composer components (19); BlobStore adapter internals (16); reclaim crons (17).

## Updates (task pack v2)

- **New** in v2 — archive implied upload via blobstore/refs; explicit HTTP upload ticket enables **19** UI.

## API (backend)

- [x] Upload: create blob via BlobStore → ensure MessageDraft (22) → sync draft joins
- [x] Return `attachmentId` + upload session handles for client progress
- [x] Abort/cancel: abort multipart + best-effort cleanup
- [x] Permission: same as can post on conversation
- [x] List attachment metadata for a draft anchor (optional helper for 19 hydrate)
- [x] Integration test: upload → load(draft) returns attachment

## App (frontend)

_N/A — ticket 19 wires the client._

## Reviewer notes

**Upload backend is incomplete without 19** — you won’t click-upload in the app yet. Chunk 3 “complete” for users requires **18 + 19**.

## PR

- [x] `[messaging 18] Conversation upload API` — https://github.com/mateusmento/denser/pull/16 (open, awaiting maintainer review)
