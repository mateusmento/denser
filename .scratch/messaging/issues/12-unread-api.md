# 12 — Unread / ReadState API

**Chunk:** 2  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** ready-for-agent  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-12-unread-api`  
**Specs:** [conversation.md](../../../docs/ui-surfaces/conversation.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Persist **last_read** per user×conversation; mark-read on open; unread summary for badges. UI in **13**.

**Owns:** read_state handlers + unread summary query.

**Must not touch:** unread divider UI (**13**); attachments; schedule.

**Consumes:** `read_state` table from **01**; message ids from **02**.

## Updates (task pack v2)

- **Split from** archive **12** (unread): API half. Renumbered archive 12 → **12** api + **13** app.

## API (backend)

- [ ] `ReadState` persist per user × conversation
- [ ] `MarkRead` — advance to latest on open (idempotent)
- [ ] `GetUnreadSummary` for nav/sidebar badge counts

## App (frontend)

_N/A_

## PR

- [ ] `[messaging 12] Unread / ReadState API` — [PR-POLICY.md](../PR-POLICY.md)
