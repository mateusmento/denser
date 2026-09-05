# 11 — Schedule message product (+ attachment joins)

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 07 — Attachment references + reclaim; 08 — Message drafts; 09 — Scheduling runner  
**Branch:** `agent/messaging-11-schedule-message`  
**Spec:** [SCHEDULING.md](../../../docs/SCHEDULING.md), [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)

**What to build:** Users can **schedule** a message (once first): create job, **sync attachment joins** on scheduled anchor, clear draft, list/edit/cancel schedules, and on fire **PostMessage** with `occurrence_key` + trustedDelivery; once-job releases scheduled joins.

**Owns:** ScheduleMessage/Update/Cancel/List APIs; scheduled_message handler; composer schedule chrome wiring; schedules list UI if minimal.

**Must not touch:** redesign of claim SQL (09); BlobStore adapters; meeting_start LiveKit.

**Consumes:** `createScheduledMessageJob` + `parseScheduledJob` from 01; ClaimDueJobs registry; AttachmentReferences; PostMessage (03); drafts clear (08).

- [ ] Schedule create uses `createScheduledMessageJob` — not hand-built `{ type, payload }`
- [ ] List/get schedules return `ScheduledJobDto<'scheduled_message'>` (parsed payloads)
- [ ] `scheduled_message` handler receives narrowed job type from registry

- [ ] Schedule create/update stores content in payload **without** attachment id SoT; joins hold files
- [ ] Fire loads joins → PostMessage with occurrence_key idempotency
- [ ] Once: release scheduled anchor after success; recurring keep (if S2 presets not in scope, once-only OK)
- [ ] Cancel releases joins + disables job
- [ ] Clear draft on schedule
- [ ] Access lost at fire → fail job + visible error (per SCHEDULING preference)
- [ ] PR `[messaging 11] …`

## Comments

Recurrence + timezone can be follow-up PR still under this ticket number or a child — prefer once-only acceptance for first merge.
