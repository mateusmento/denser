# 17 — Attachment references + reclaim

**Chunk:** 3a — Attachments storage (backend)  
**Layer:** api  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) A1  
**Status:** resolved  
**Blocked by:** 01 — Scaffold  
**Branch:** `agent/messaging-17-attachment-refs-api`  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Implement the **attachment reference graph**: `sync` / `release` / `releaseAttachment` / `reclaim` + `load` for anchors **draft**, **scheduled**, **message**. Hourly **reclaim** cron (join refcount) and separate **orphan object** sweep (misnamed “staging” in epicstory — name clearly here). Wire **PostMessage** (ticket 02) to `sync` message joins when that PR is merged.

**Owns:** `AttachmentReferences` module; eligibility rules; reclaim + orphan crons; join table writes.

**Must not touch:** S3/R2 SDK (inject BlobStore from 16); upload HTTP (18); any Vue UI.

**Parallel with:** 16 (blobstore) and 22 (drafts api) after scaffold.

## Updates (task pack v2)

- **Renumbered** from archive **07** (attachment refs). May merge before **16** if BlobStore delete no-ops; production GC needs **16**.

## API (backend)

- [ ] `commit({ op: 'sync' })` sets exact join set per anchor
- [ ] `release` / `releaseAttachment` / `reclaim` per ATTACHMENTS.md
- [ ] `load(anchor)` → `AttachmentDto[]` with URLs via BlobStore.getUrl
- [ ] GC only when join refcount = 0 (+ grace); never GC protected rows
- [ ] `trustedDelivery` for schedule-fire / system paths
- [ ] PostMessage path syncs message anchor (coordinate merge with 02)
- [ ] Tests: sync/release refcount; concurrent GC race

## App (frontend)

_N/A._

## Reviewer notes

Pool + joins only — no composer changes. Files pane (21) and upload (18) depend on this.

## PR

- [x] `[messaging 17] Attachment references + reclaim` — [PR-POLICY.md](../PR-POLICY.md) → PR #9
