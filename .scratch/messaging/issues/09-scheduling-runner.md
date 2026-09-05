# 09 — Scheduling runner (claim + next_run_at)

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-09-scheduling-runner`  
**Spec:** [SCHEDULING.md](../../../docs/SCHEDULING.md) (port policy + improvements)

**What to build:** **ScheduledJob** runner: materialize **`next_run_at`**, claim with **`FOR UPDATE SKIP LOCKED`**, stale locks, retry/backoff, handler registry. Ship a **noop or log handler** for unknown types; do **not** implement scheduled_message → PostMessage (ticket 11).

**Owns:** scheduling module; claim SQL; cron tick; mark processed / advance next_run_at; occurrence_key generation.

**Must not touch:** conversation PostMessage; attachment joins on jobs (can insert join rows in 11); meeting start LiveKit.

**Consumes:** typed scheduling contracts from 01; tables from 02. Claim returns rows **parsed** via `parseScheduledJobRow` before dispatch.

- [ ] createJob uses per-type **factories** from contracts (not raw jsonb blobs)
- [ ] Handler registry is typed: `ScheduledJobHandlerMap`; dispatch narrows on `job.type`

- [ ] createJob helper sets due_at + next_run_at (+ timezone when recurring later)
- [ ] findDueJobs / claim uses SKIP LOCKED + lock_id + stale TTL
- [ ] Success/failure paths with backoff and max retries → processed
- [ ] occurrence_key = jobId + occurrence instant
- [ ] ~10s dispatcher with bounded concurrency (or sequential OK for v1 with clear TODO)
- [ ] Tests for claim concurrency (two claimants don’t double-take)
- [ ] PR `[messaging 09] …`

## Comments

Read epicstory `scheduled-job.repository.ts` for lock/retry ideas; denser SQL should stay dumb on recurrence.
