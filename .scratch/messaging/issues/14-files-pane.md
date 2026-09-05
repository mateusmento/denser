# 14 — Conversation files pane (delivered attachments)

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 07 — Attachment references + reclaim  
**Branch:** `agent/messaging-14-files-pane`  
**Spec:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md)

**What to build:** Slack-like **files** list for a conversation (delivered message joins); delete uses `releaseAttachment` with confirm.

**Owns:** listDelivered UI + API route if not already exposed; delete confirm UX.

**Must not touch:** scheduler; drafts drawer.

- [ ] List delivered attachments for conversation
- [ ] Open/download via getUrl
- [ ] Delete → releaseAttachment + confirm
- [ ] PR `[messaging 14] …`

## Comments

Can parallelize with 10–13 once 07 is merged.
