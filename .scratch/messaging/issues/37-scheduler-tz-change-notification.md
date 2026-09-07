# 37 — Notify schedulers on private space timezone change

**Chunk:** 5  
**Layer:** api + app  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md)  
**Status:** open  
**Blocked by:** **27** — Schedule recurrence + timezone (recompute path ships in 27)  
**Branch:** —  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [27-schedule-recurrence.md](./27-schedule-recurrence.md)

## Problem

**27** implements Option C step 1–2 when a private space timezone is PATCHed:

1. Recompute `next_run_at` for affected active `scheduled_message` jobs (`recomputeScheduledJobsForPrivateSpace`).
2. Preserve `timeOfDay` / `weekdays` in the **new** wall clock.

Step 3 — **notify affected schedulers** — is not built. Users who scheduled messages under that space are not told their send times were adjusted.

## What to build

When `patchSpace` changes a **private** space `timezone` and jobs are recomputed:

1. Collect distinct `scheduled_by` user ids from affected jobs (before or after recompute).
2. Emit an in-app notification per scheduler, e.g.  
   `Timezone for {space title} changed; your scheduled messages were adjusted.`
3. Client surfaces the notification in the existing shell/toast or notifications feed (match whatever pattern unread/mentions use when available; otherwise a one-shot toast on next session is acceptable for v1).

**Owns:** notification payload + dispatch from `spaces/service.ts` (or scheduling domain hook); minimal client display.

**Must not touch:** recompute algorithm (already in **27**); outbox UI (**33**).

## API

- [ ] After recompute, resolve affected scheduler user ids + job count (or conversation ids) for the message body.
- [ ] Persist/dispatch notification event (reuse realtime or notifications table if one exists; document choice).
- [ ] Integration test: patch space TZ → jobs updated → notification recorded for scheduler, not for unrelated users.

## App

- [ ] Subscribe or poll for scheduler TZ-change notifications.
- [ ] Show copy from spec; link optional (“View scheduled messages” → **33** outbox when available).

## Product reference

From **27** grilling — [On private space timezone change (Option C)](./27-schedule-recurrence.md#on-private-space-timezone-change-option-c--recompute--notify):

> Notify affected schedulers (in-app): “Timezone for {space} changed; your scheduled messages were adjusted.”

## Comments

**Split from 27 (2026-09-07):** Recompute ships with **27**; notification deferred here to keep **27** focused on schedule primitives.
