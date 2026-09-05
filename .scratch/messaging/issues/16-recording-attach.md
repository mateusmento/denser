# 16 — Screen recording → attach

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 06 — BlobStore; 07 — Attachment references  
**Branch:** `agent/messaging-16-recording-attach`  
**Spec:** [conversation.md](../../../docs/ui-surfaces/conversation.md), [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)

**What to build:** Screen recording from composer **uploads and attaches** into the conversation (not download-only).

**Owns:** recording capture UX → upload via BlobStore → draft/message joins; attach-only send path.

**Must not touch:** Meeting room LiveKit recording (MEETINGS M3).

- [ ] Record → upload progressive + cancel
- [ ] Lands as attachment on draft/message
- [ ] No download-only stub as the product outcome
- [ ] PR `[messaging 16] …`

## Comments

Meeting recordings are a different ticket under meetings pack later.
