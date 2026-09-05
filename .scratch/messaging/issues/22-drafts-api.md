# 22 — Message drafts API

**Chunk:** 4  
**Layer:** api  
**Domain:** [MESSAGE-DRAFTS.md](../../../docs/MESSAGE-DRAFTS.md)  
**Status:** ready-for-agent  
**Blocked by:** 01 — Scaffold  
**Branch:** `agent/messaging-22-drafts-api`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Get/Upsert/Delete message drafts with **version/409**; TTL purge cron; hooks for clear-on-send (**02**) and clear-on-schedule (**25**). **No dual-write** localStorage SoT. Composer hydrate is **23**.

**Owns:** draft HTTP/API; draft purge job.

**Must not touch:** composer draft UI (**23**); drafts drawer/badge (deferred); BlobStore adapters.

**Consumes:** `MessageDraftDto` from **01**; `AttachmentReferences` when **17** merged — until then body-only upsert OK.

## Updates (task pack v2)

- **Split from** archive **08** (message drafts): API half. Renumbered archive 08 → **22** api + **23** app.

## API (backend)

- [ ] Unique draft per (conversation, author, thread_id null|id)
- [ ] Get/Upsert/Delete; upsert version bump + sliding `expires_at`; **409** returns server draft
- [ ] TTL purge cron releases attachment anchor (via port) then deletes row
- [ ] Clear on send success (called from **02**); clear on schedule (called from **25**)
- [ ] No epicstory dual-write / localStorage SoT
- [ ] Attachment sync on upsert calls AttachmentReferences when **17** merged; else accept `attachmentIds` and TODO sync

## App (frontend)

_N/A_

## PR

- [ ] `[messaging 22] Message drafts API` — [PR-POLICY.md](../PR-POLICY.md)
