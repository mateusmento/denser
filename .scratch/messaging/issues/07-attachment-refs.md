# 07 — Attachment references + reclaim

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-07-attachment-refs`  
**Spec:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md), [interfaces.md](../interfaces.md)

**What to build:** Implement **AttachmentReferences** (`sync` / `release` / `releaseAttachment` / `reclaim` + `load`) and hourly reclaim cron. Wire PostMessage (when 03 present) to sync message joins. Upload path can call ensureDraft stub until 08.

**Owns:** attachment-references module; reclaim cron; join table writes; eligibility rules.

**Must not touch:** S3/R2 SDK details (inject BlobStore from 06); scheduled fire (11); files pane UI (optional stretch).

**Consumes:** anchors + AttachmentDto; BlobStore.deleteObject for GC; tables from 02.

- [ ] commit sync/release/releaseAttachment/reclaim behave per ATTACHMENTS
- [ ] load(anchor) returns DTOs with URLs via BlobStore.getUrl
- [ ] GC only when join refcount 0 (+ grace)
- [ ] Separate orphan object sweep job (named clearly — not “staging”)
- [ ] trustedDelivery bypasses uploader match for system paths
- [ ] Tests for sync/release/refcount GC race safety
- [ ] PR `[messaging 07] …`

## Comments

May merge after or before 06 if BlobStore stub deletes no-op; production GC needs 06.
