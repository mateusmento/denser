# Scheduling

**Status:** Draft (architecture from epicstory; denser domain wiring TBD)  
**Touches:** [CONVERSATIONS.md](./CONVERSATIONS.md) (scheduled messages), [MEETINGS.md](./MEETINGS.md) (scheduled meetings), [ATTACHMENTS.md](./ATTACHMENTS.md) (joins on jobs — never payload-only IDs), [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md) (clear draft on schedule)  
**Sources:** epicstory `api/src/scheduling/*`, channel schedule reactions, calendar → meeting jobs  

One **job runner** for due work across denser. Product surfaces (schedule a chat message, start a meeting at T, remind before start) are **job types** on that runner — not separate cron stacks per feature.

---

## Decisions (architecture)

| Decision | Choice | Rejected / why |
| --- | --- | --- |
| Scheduler shape | Single **`ScheduledJob`** table + typed `payload` + dispatcher | One queue/table per feature; Bull/Redis required for v1 |
| Dispatcher | Nest (or denser equivalent) **poll cron** (~10s) + Postgres **`FOR UPDATE SKIP LOCKED`** | In-process `setTimeout` only; exclusive Redis queue for this scale |
| Scheduled message | Job type `scheduled_message` — **not** a second entity table | Parallel `ScheduledMessage` table that reimplements due/lock/retry |
| Attachment ids on schedule | **Joins** on the job ([ATTACHMENTS.md](./ATTACHMENTS.md)) | IDs only in JSON payload (breaks refcount / GC / load) |
| Meeting schedule | Same runner: `meeting_start` (+ optional `meeting_reminder`) keyed to Meeting / room | Separate meeting cron; glue calls to Conversation |
| Delivery flags | Internal-only (`markAsScheduled`, `trustedDelivery`) — never public HTTP | Client-forged “was scheduled” / bypass uploader checks |
| Once vs recurring joins | **Once:** release scheduled attachment anchor after fire; **recurring:** keep template joins | Always release (breaks recurrence) or always keep forever without policy |
| Failure | Lock TTL + retry/backoff; max retries → permanent `processed` | Silent drop; infinite retry storms |
| Claim cursor | Materialized **`next_run_at`** (app computes recurrence) | Recurrence math inside claim SQL (epicstory) as denser default |
| Delivery idempotency | **`occurrence_key`** unique on side effects | Rely only on “mark processed after emit” |
| Port epicstory | **Semantics** of claim/lock/retry + joins; improve as above in denser | Runtime dependency on epicstory; invent weaker claim from scratch |
| Payload typing | **Discriminated union** per `type` in `@denser/contracts`; **factories** on create, **parse** on read; handlers narrow by `type` | `Record<string, unknown>` payload at API/DB boundaries |

---

## Domain model

```text
Workspace (root_space_id)
  └── ScheduledJob*
        ├── type + payload (jsonb) + due / recurrence / lock / retry
        └── AttachmentReference*  (scheduled anchor — see ATTACHMENTS.md)

Conversation ──(payload.conversationId)──► scheduled_message job
Meeting room / Meeting ──► meeting_start | meeting_reminder jobs
```

### Objects

| Object | Role |
| --- | --- |
| **ScheduledJob** | Durable due work: when, type, payload, lock, retry, recurrence |
| **Scheduled message** | Product name for job `type = scheduled_message` (composer “Schedule”) |
| **Meeting start job** | At `scheduled_starts_at`, runs StartMeeting (system host path) |
| **Meeting reminder job** | Optional notify before start |
| **Occurrence** | One fire of a recurring job (`occurrence_at`); not a separate table |

### Job types (v1 catalog)

| Type | Payload essentials | Side effect |
| --- | --- | --- |
| `scheduled_message` | conversationId, senderId, TipTap body, quotesId?, threadId?, poll? | PostMessage (internal); hydrate attachments from **joins** |
| `meeting_start` | meetingId (or room + schedule fields) | StartMeeting if still `scheduled` and room free |
| `meeting_reminder` | meetingId, notifyMinutesBefore | Soft notify (conversation card / inbox TBD) |

Later (same runner, not blocking messaging): `due_document_reminder`, `workspace_purge`, etc.

### Typed payload contract

`payload` is **never** `Record<string, unknown>` at product boundaries. `@denser/contracts` owns:

1. **Per-type Zod schemas** — each payload includes a literal **`type`** field matching the job row’s `type`.
2. **`ScheduledJobPayload`** — `z.discriminatedUnion('type', [...])`.
3. **`ScheduledJobDto`** — discriminated union on `type` with the matching payload shape (or generic `ScheduledJobDto<T>`).
4. **Factories** — `createScheduledMessageJob(...)`, `createMeetingStartJob(...)`, etc. return a fully typed insert/DTO; callers cannot pass the wrong payload for a type.
5. **Parse on read** — `parseScheduledJob(row)` / `parseScheduledJobPayload(type, rawJson)` validates DB/API JSON before handlers or list APIs use it.
6. **Handler registry** — `registerScheduledJobHandler('scheduled_message', handler)` where `handler` receives `ScheduledJobDto<'scheduled_message'>`; dispatch `switch` is exhaustive (`assertNever`).

```text
Create path:  factory(type-specific input) → validated payload → INSERT
Read path:    SELECT → parseScheduledJob(row) → typed handler / API mapper
List path:    same parse — clients never see untyped payload
```

**Rules**

- **`job.type` must equal `payload.type`.** Reject insert/update if they diverge.
- **Attachment ids are not payload fields** — joins only ([ATTACHMENTS.md](./ATTACHMENTS.md)).
- **Adding a job type** requires: payload schema + factory + handler + exhaustiveness update (TypeScript should fail if any step is missing).
- **HTTP create** accepts only the factory’s input shape (or a dedicated command DTO), not raw `{ type, payload }` blobs.

Reference pattern: epicstory `buildScheduledJobPayload` + per-type payload classes — denser uses **Zod + discriminated unions** instead of class-validator classes, same seam.

---

## Runner mechanics

```text
every ~10s:
  claim due jobs (SKIP LOCKED, set lock_id / locked_at)
  emit scheduled-job.<type>
  reaction → domain command
  success → mark processed (once) or advance last_run_at (recurring)
  failure → unlock + retryCount + backoff; after max → processed (dead)
```

| Concern | Behavior |
| --- | --- |
| Claim | `next_run_at <= now()`; not processed; lock free or stale; retry backoff elapsed |
| Stale lock | e.g. **5 min** — reclaim after crash |
| Retry | Exponential backoff; cap (~5); store `last_error` |
| Recurrence | v1 presets (**once \| daily \| weekly**); app computes **`next_run_at`** + timezone — see [Port policy](#port-policy-epicstory--denser) / [Improvements](#architecture-improvements-beyond-epicstory). Do not invent ad-hoc cron or pretend full RRULE in v1. |
| Idempotency | Handlers tolerate re-claim; **occurrence_key** uniqueness on side effects (not hope-based emit-once) |

No Bull/Agenda required for v1. A work queue may appear later for fan-out; the **job row remains SoT** for due state, schedule UI, and attachment joins.

---

## Port policy (epicstory → denser)

Epicstory’s scheduler is a **good reference** for denser v1: polymorphic jobs, Postgres claim + `SKIP LOCKED`, stale locks, retry/backoff, and schedule attachments as joins. Implementers should **port those semantics into denser** (new schema/module in this repo), not invent a weaker claim algorithm from scratch, and not import epicstory as a runtime dependency.

| Do | Don’t |
| --- | --- |
| Read `epicstory/api/src/scheduling/repositories/scheduled-job.repository.ts` (`findDueJobs`) and port **claim / lock / retry / once vs recurring completion** behavior | Cargo-cult Nest `EventEmitter` wiring or messy cron call-site args |
| Keep one `ScheduledJob` table + typed reactions/commands | One queue table per feature |
| Keep attachment ids on joins ([ATTACHMENTS.md](./ATTACHMENTS.md)) | IDs only in JSON payload |
| Rewrite SQL/ORM for denser’s stack; prefer the **improved claim shape** below when implementing | Copy opaque recurrence math into SQL if we materialize `next_run_at` instead |

**Verdict:** architecture and claim *ideas* are strong; several epicstory imperfections are called out next — denser should fix those while porting, not wait for a rewrite later.

---

## Architecture improvements (beyond epicstory)

### 1. Materialize `next_run_at` (simplify claim SQL)

**Epicstory imperfection:** due claim embeds recurrence math in SQL (`occurrence_at` from `date_trunc` + `timeOfDay`, interval/weekday/`last_run_at` guards). Correct but hard to evolve and weak on timezones.

**Better:**

| Layer | Responsibility |
| --- | --- |
| App (create / update / after successful run) | Given recurrence + **IANA timezone**, compute the next fire instant → write **`next_run_at`** (timestamptz) |
| Claim SQL | Only `next_run_at <= now()`, not processed, lock free/stale, retry backoff ready — then `FOR UPDATE SKIP LOCKED` |
| Recurring success | Advance `last_run_at` / `last_occurrence_at`; recompute and set the following `next_run_at` (or `processed` if series ended) |

v1 product recurrence can stay **once | daily | weekly** presets (epicstory-class UX). Computation moves to TypeScript (testable); SQL stays dumb and portable.

Later (calendar product): RRULE/ICS libraries feed the **same** `next_run_at` column — claim SQL unchanged.

### 2. Timezone-aware scheduling

**Epicstory imperfection:** “today at timeOfDay” is effectively server/DB calendar semantics, not “user’s 9:00 in `America/Sao_Paulo`.”

**Better:** store `timezone` on the job (or inherit workspace default). All preset expansions use that zone. Store instants in UTC (`next_run_at` / `due_at` as timestamptz). UI shows local wall time.

### 3. Claim vs execute + bounded concurrency

**Epicstory imperfection:** cron tick claims then **sequentially** `emitAsync` each job on the same process.

**Better (still Postgres SoT):**

```text
every ~10s:
  claim batch → status running / lock_id
  process with bounded concurrency (e.g. 8–32)
  each: run type handler → success/fail with lock_id check
```

Optional later: claim writes rows, then **enqueue job ids** to Redis/Bull/SQS for workers. Queue is a **fan-out accelerator only** — cancel/edit/list/attachments still read `ScheduledJob`. Never make Redis the only schedule record.

### 4. Occurrence delivery keys (true idempotency)

**Epicstory imperfection:** claim + domain command are not one transaction; a crash after PostMessage but before `markAsProcessed` can double-deliver unless the domain rejects duplicates.

**Better:**

- Every fire has an **`occurrence_key`** (e.g. `jobId + occurrence_at` ISO).
- Side effects that must be once (PostMessage, StartMeeting) accept that key and enforce **unique** `(job_id, occurrence_key)` or embed it in message `client_id` / meeting start idempotency table.
- `markAsProcessed` / advance `next_run_at` only after success; retries reuse the same `occurrence_key` until success.

This is the main correctness upgrade over “hope the reaction is careful.”

### 5. Dispatcher hygiene

**Epicstory imperfection:** look-ahead / window args and comments at the cron call site are easy to misread; claim batch size is huge.

**Better:** named constants (`CLAIM_INTERVAL`, `STALE_LOCK_MS`, `MAX_BATCH`, `MAX_RETRIES`, `BASE_BACKOFF_MS`); metrics (claim lag, in-flight, dead-letter count); structured dead-letter when max retries hit (queryable `processed` + `last_error`, optional admin UI later).

### 6. What not to “improve” prematurely

| Temptation | Why wait |
| --- | --- |
| Replace Postgres claim with Bull-only jobs | Loses schedule UI SoT and attachment join parent |
| Full RRULE in messaging v1 | Presets + `next_run_at` cover chat/meeting; calendar can come later |
| Exactly-once distributed transactions | Occurrence keys + idempotent commands are enough |

---

## Phasing (runner quality)

| Phase | Ship |
| --- | --- |
| **S0** | Job table + claim on **`next_run_at`** + lock/retry + once handlers; port epicstory behavior, not its recurrence-in-SQL |
| **S1** | Scheduled message once + occurrence_key on PostMessage |
| **S2** | Preset recurrence + timezone + recompute `next_run_at` |
| **S3** | Bounded worker concurrency; optional queue fan-out |
| **S4** | Richer recurrence / ICS if calendar product needs it |

---

## Scheduled messages

### Lifecycle

1. **Composer** stages body (+ attachment uploads hang on **draft** — [ATTACHMENTS.md](./ATTACHMENTS.md)).
2. **ScheduleMessage** creates job (`dueAt`, recurrence, content payload **without** attachment id list as SoT) → **`sync` attachment joins** to `{ type: 'scheduled', jobId }` → clear/release draft.
3. **List / edit** hydrates tiles via `load` on scheduled anchor; update may re-`sync` joins if not yet processed.
4. **Fire** — reaction `load`s joins → **PostMessage** with those ids + internal `markAsScheduled` + `trustedDelivery` → for **once**, **`release` scheduled anchor** (message joins remain); for **recurring**, keep scheduled joins.
5. **Cancel** — `release` scheduled joins → delete or mark job cancelled/processed.

### Commands / queries (product)

| API | Notes |
| --- | --- |
| **ScheduleMessage** | conversationId, dueAt, recurrence?, body, quotesId?, threadId?, attachmentIds?, clientId? |
| **UpdateScheduledMessage** | Only if not processed; may patch due/body/attachments |
| **CancelScheduledMessage** | Release joins + remove/disable job |
| **ListScheduledMessages** | For conversation (and optional “my schedules” later) |

Permissions: same as **can post** on the conversation at schedule time; re-check can post (or still peer ∩ workspace) at fire — define fail policy (dead job + notify vs drop silently). Prefer **fail job + user-visible error** if access lost.

### Events

`scheduled_message.upserted` · `scheduled_message.cancelled` · `scheduled_message.delivered` (or rely on `message.created` with `was_scheduled` flag)

---

## Scheduled meetings

Meetings stay owned by [MEETINGS.md](./MEETINGS.md). Scheduling only **arms the runner**.

| Step | Owner |
| --- | --- |
| User schedules occurrence | **ScheduleMeeting** → Meeting row `status=scheduled` + create `meeting_start` (+ optional `meeting_reminder`) |
| Reminder fires | Soft notify; does not start A/V |
| Start fires | **StartMeeting** (system); still ≤1 live per room; if conflict → fail job / reschedule policy TBD |
| Cancel | Cancel Meeting + cancel/release related jobs |

Jobs do **not** hold LiveKit credentials. Lobby / devices remain client-side at join time.

Attachments on meetings (recordings, agenda files) use meeting / message anchors in [ATTACHMENTS.md](./ATTACHMENTS.md) — not meeting job JSON.

---

## Features (catalog)

| Feature | Phase | Notes |
| --- | --- | --- |
| Job table + claim/retry | S0 | `next_run_at` claim; see runner quality phasing |
| Schedule message once | S1 | Messaging cut; occurrence_key on deliver |
| List / edit / cancel schedules | S1 | Conversation schedules tab / composer caption |
| Recurrence + timezone | S2 | Presets; recompute `next_run_at` |
| Bounded concurrency / optional queue fan-out | S3 | Job row still SoT |
| Meeting start + reminder jobs | With Meetings M0–M1 | |
| Attachment joins on jobs | With Attachments A2 | Blocker for schedule+files |

---

## Data schema (conceptual)

### ScheduledJob

| Field | Notes |
| --- | --- |
| id | JobId |
| root_space_id | Workspace boundary |
| type | enum above |
| payload | jsonb — **typed union** per `type` (validated on read/write); **no attachment id SoT** |
| due_at | Series anchor / user-facing “scheduled for” (especially once) |
| next_run_at | **Claim cursor** — next UTC instant to fire; maintained by app |
| timezone | IANA zone for preset expansion (required when recurring) |
| recurrence | null / once / daily / weekly … (presets; not full RRULE in v1) |
| last_occurrence_at | Last successfully delivered occurrence (idempotency / guards) |
| notify_minutes_before | Optional (reminders) |
| processed | Once done or permanently failed |
| last_run_at | Optional alias / legacy guard; prefer `last_occurrence_at` + `next_run_at` |
| lock_id / locked_at | Claim |
| retry_count / last_retry_at / last_error | |
| created_by | Optional auditor |

### scheduled_job ↔ attachment

Join only — see [ATTACHMENTS.md](./ATTACHMENTS.md).

---

## Constraints

1. Attachment ids for scheduled messages live in **reference joins**, not solely in `payload`.
2. Public HTTP cannot set `markAsScheduled` / `trustedDelivery`.
3. Fire path must not invent a second upload; reuse blob ids from joins.
4. Claiming uses row locks; two workers must not double-**claim** the same due row; side effects use **occurrence_key** so double-**execute** cannot double-post.
5. Meeting start job respects ≤1 live Meeting per room.
6. Cancelled / ended meetings must not start from a stale job (reaction checks Meeting status).
7. Claim SQL does not re-implement recurrence math when `next_run_at` is present.
8. `job.type` === `payload.type`; all reads/writes go through **parse** / **factory** from `@denser/contracts` — no untyped payload at handlers or public HTTP.

---

## Lessons from epicstory (port)

| Keep | Avoid / improve in denser |
| --- | --- |
| Polymorphic `ScheduledJob` + type handlers | Bull-only jobs with no durable product row for schedule UI |
| SKIP LOCKED + stale lock + backoff | Fire-and-forget timers; redesign claim from scratch without reading epicstory |
| Attachment joins on job; payload free of id SoT | “Just put attachmentIds in JSON” |
| Once release vs recurring keep (attachments) | One cleanup policy for both |
| Internal delivery flags | Client-trusted schedule markers |
| Split attachment reclaim vs object-store orphan sweep | One cron that tries to do both and misnames “staging” |
| — | Recurrence math **inside** claim SQL → materialize **`next_run_at`** + timezone in app |
| — | Sequential emit-only tick → bounded concurrency; optional queue fan-out later |
| — | Hope-based idempotency → **occurrence_key** on PostMessage / StartMeeting |

---

## Out of scope (initial)

- Full calendar product / ICS sync / RRULE editor (S4+)
- Cross-workspace jobs
- User-defined arbitrary cron expressions in UI
- Redis/Bull as the only schedule SoT
- Media library “pick existing file” (Attachments deferred)

---

## Open questions

- Fire when author lost post access: dead-letter + toast vs drop.
- Meeting start conflict (another live meeting): skip, queue, or notify hosts only.
- “My scheduled messages” across conversations in v1 or conversation-scoped only.
- Draft dual-write timing — locked server-authoritative in [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md); only TTL/offline cache remain open there.
- Default timezone: workspace setting vs user profile vs browser at schedule time.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-05 | Typed payload contract: discriminated union, factories, parse-on-read, exhaustive handlers. |
| 2026-09-04 | Port policy + improvements: `next_run_at`, timezone, occurrence_key, concurrency; epicstory verdict. |
| 2026-09-04 | Initial Scheduling domain from epicstory runner + denser conversation/meeting wiring. |
