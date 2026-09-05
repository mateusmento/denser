# 24 — Scheduling runner API

**Chunk:** 5  
**Layer:** api  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md)  
**Status:** claimed  
**Blocked by:** 01 — Scaffold  
**Branch:** `agent/messaging-24-scheduler-api`  
**Specs:** [interfaces.md](../interfaces.md) · [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

**ScheduledJob** runner: materialize **`next_run_at`**, claim with **`FOR UPDATE SKIP LOCKED`**, stale locks, retry/backoff, typed handler registry. Ship **noop/log handler** for unknown types — do **not** implement `scheduled_message` → PostMessage (**25**).

**Owns:** scheduling module; claim SQL; cron tick; mark processed / advance `next_run_at`; `occurrence_key` generation.

**Must not touch:** conversation PostMessage (**02**); attachment joins on jobs (**25**); meeting start LiveKit.

**Consumes:** typed scheduling contracts from **01**; tables from **01**. Claim returns rows **parsed** via `parseScheduledJobRow` before dispatch.

## Updates (task pack v2)

- **Renumbered** from archive **09** (scheduling runner). Product schedule message split to **25** + **26** + **27**.

## API (backend)

- [ ] `createJob` uses per-type **factories** from contracts (not raw jsonb blobs)
- [ ] Handler registry typed: `ScheduledJobHandlerMap`; dispatch narrows on `job.type`
- [ ] `createJob` sets `due_at` + `next_run_at` (+ timezone when recurring in **27**)
- [ ] `findDueJobs` / claim uses SKIP LOCKED + `lock_id` + stale TTL
- [ ] Success/failure paths with backoff and max retries → processed
- [ ] `occurrence_key` = jobId + occurrence instant
- [ ] ~10s dispatcher with bounded concurrency (sequential OK for v1 with clear TODO)
- [ ] Tests for claim concurrency (two claimants don’t double-take)

## App (frontend)

_N/A_

## Comments

Read epicstory `scheduled-job.repository.ts` for lock/retry ideas; denser SQL stays dumb on recurrence (**27**).

## PR

- [ ] `[messaging 24] Scheduling runner API` — [PR-POLICY.md](../PR-POLICY.md)
