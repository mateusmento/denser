# 08 — Message drafts (server-authoritative)

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-08-message-drafts`  
**Spec:** [MESSAGE-DRAFTS.md](../../../docs/MESSAGE-DRAFTS.md)

**What to build:** Get/Upsert/Delete message drafts with version/409; composer **hydrates from server** and debounce-upserts; clear draft on successful send (hook 03) and document clear-on-schedule for 11. TTL purge cron.

**Owns:** draft HTTP/API; draft purge job; composer draft composable (server-authoritative).

**Must not touch:** dual-write localStorage SoT; drafts drawer/badge (deferred); BlobStore adapters.

**Consumes:** MessageDraftDto; ensureDraft for uploads when 06/07 available — until then upsert body-only.

- [ ] Unique draft per (conversation, author, thread_id null|id)
- [ ] Upsert version bump + sliding expires_at; 409 returns server draft
- [ ] Get hydrates composer; empty deletes draft
- [ ] Clear on send success
- [ ] Purge expired releases attachment anchor (via port) then deletes
- [ ] No epicstory dual-write
- [ ] PR `[messaging 08] …`

## Comments

Attachment sync on upsert calls AttachmentReferences when 07 merged; otherwise accept attachmentIds and TODO sync.
