# 25 — Schedule message API + fire handler

**Chunk:** 5  
**Layer:** api  
**Domain:** [SCHEDULING.md](../../../docs/SCHEDULING.md) · [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)  
**Status:** ready-for-agent  
**Blocked by:** 24 — Scheduler; 17 — Attachment refs; 22 — Drafts; 02 — Messages  
**Branch:** `agent/messaging-25-schedule-message-api`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Schedule a message (once first): create job, **sync attachment joins** on scheduled anchor, clear draft, list/edit/cancel. On fire → **PostMessage** with `occurrence_key` + `trustedDelivery`; once-job releases scheduled joins. **No schedule UI** — **26**.

**Owns:** ScheduleMessage/Update/Cancel/List APIs; `scheduled_message` handler.

**Must not touch:** claim SQL redesign (**24**); BlobStore adapters; meeting_start LiveKit; SchedulePopover (**26**).

**Consumes:** `createScheduledMessageJob` + `parseScheduledJob` from **01**; ClaimDueJobs registry **24**; AttachmentReferences **17**; PostMessage **02**; drafts clear **22**.

## Updates (task pack v2)

- **Renumbered** from archive **11** (schedule message): API + fire half. UI split to **26**; recurrence to **27**.

## API (backend)

- [ ] Schedule create uses `createScheduledMessageJob` — not hand-built `{ type, payload }`
- [ ] List/get return `ScheduledJobDto<'scheduled_message'>` (parsed payloads)
- [ ] `scheduled_message` handler receives narrowed job type from registry
- [ ] Schedule create/update stores content in payload **without** attachment id SoT; joins hold files
- [ ] Fire loads joins → PostMessage with `occurrence_key` idempotency
- [ ] Once: release scheduled anchor after success; recurring keeps joins (**27**)
- [ ] Cancel releases joins + disables job
- [ ] Clear draft on schedule
- [ ] Access lost at fire → fail job + visible error (per SCHEDULING.md)
- [ ] `scheduled_message.upserted` events

## App (frontend)

_N/A_

## Comments

Recurrence + timezone follow in **27** — once-only acceptance OK for first merge of this ticket.

## PR

- [ ] `[messaging 25] Schedule message API + fire handler` — [PR-POLICY.md](../PR-POLICY.md)
