# 04 — Quote preview API

**Chunk:** 2  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** claimed  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-04-quotes-api`  
**Specs:** [conversation.md](../../../docs/ui-surfaces/conversation.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

**Join-on-read** `quoted` preview on list/get: strip images, size caps, omit when target missing. Pure preview module — **03** owns `around` paging; **05** owns quote card UI.

**Owns:** quote preview builder; list/get enrichment.

**Must not touch:** quote card interaction (**05**); attachments; scheduler.

**Consumes:** `QuotedPreviewDto` from **01**; `ListMessages` `around` from **02**.

## Updates (task pack v2)

- **Split from** archive **04** (quote + jump): API half. Jump UX is **05**.

## API (backend)

- [x] `QuotedPreview` builder: strip images; ≤1000 text chars + 8 KiB JSON; `displayContent` ≤160
- [x] List/get includes `quoted` when `quotes_id` set; missing target → omit chrome
- [x] Tests for cap / strip images

## App (frontend)

_N/A_

## Comments

If **02** not merged, land preview builder + unit tests first; UI can wait for **05**.

## PR

- [x] `[messaging 04] Quote preview API` — https://github.com/mateusmento/denser/pull/13 (open, awaiting maintainer review)
