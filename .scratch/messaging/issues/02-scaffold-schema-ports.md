# 02 — Scaffold messaging DB schema + ports

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 01 — Scaffold messaging contracts  
**Branch:** `agent/messaging-02-scaffold-schema-ports`  
**Spec:** [interfaces.md](../interfaces.md), [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md), [SCHEDULING.md](../../../docs/SCHEDULING.md), [MESSAGE-DRAFTS.md](../../../docs/MESSAGE-DRAFTS.md)

**What to build:** Land drizzle tables + migrations for messaging storage, and **TypeScript port interfaces** (`BlobStore`, `AttachmentReferences`, scheduling claim) with stub/noop or in-memory fakes registered in DI — enough for other agents to compile and inject. No production S3 upload, no real reclaim cron, no schedule fire side effects.

**Owns:** `packages/api` schema modules for message / read_state / attachment / joins / message_draft / scheduled_job (and peer table **stub or expand** — prefer add `conversation_peer` beside existing `conversation_member` if rename is deferred to 13); port interface files; wiring stubs.

**Must not touch:** full PostMessage business rules (03), real S3/R2 adapters (06), AttachmentReferences implementation (07), drafts HTTP (08), claim SQL body beyond a stub (09).

**Publishes:** DB tables matching conceptual schemas in domain docs; injectable `BlobStore` + `AttachmentReferences` + `ClaimDueJobs` symbols.

- [ ] Tables: messages, read_state, attachments, message_attachments, message_drafts, message_draft_attachments, scheduled_jobs, scheduled_job_attachments
- [ ] Migrations apply cleanly on empty/dev DB
- [ ] Port interfaces match [interfaces.md](../interfaces.md); stub implementations throw `NotImplemented` or no-op safely
- [ ] DI/module exports so feature tickets can inject ports
- [ ] Does not break existing conversation artifact schema/tests
- [ ] PR `[messaging 02] …`

## Comments

Keep `conversation_member` working until ticket 13. Attachment row has **no** exclusive message_id FK.
