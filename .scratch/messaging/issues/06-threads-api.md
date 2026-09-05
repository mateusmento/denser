# 06 — Threads API

**Chunk:** 2  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** ready-for-agent  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-06-threads-api`  
**Specs:** [conversation.md](../../../docs/ui-surfaces/conversation.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Thread message listing and validated `threadId` on post. Main stream still shows parent; quotes remain independent (`quotes_id` ∥ `thread_id`).

**Owns:** `ListThreadMessages` (or filter on `thread_id`); thread post validation.

**Must not touch:** ThreadPane UI (**07**); attachment adapters; drafts server (**22**).

**Consumes:** `MessageDto.threadId`; `PostMessage` from **02**.

## Updates (task pack v2)

- **Split from** archive **05** (threads): API half. Renumbered (archive 05 → **06** api + **07** app).

## API (backend)

- [ ] `ListThreadMessages` by parent / `thread_id`
- [ ] `PostMessage` with `threadId` validated (parent exists, same conversation)

## App (frontend)

_N/A_

## PR

- [ ] `[messaging 06] Threads API` — [PR-POLICY.md](../PR-POLICY.md)
