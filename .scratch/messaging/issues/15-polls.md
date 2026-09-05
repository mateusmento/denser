# 15 — Polls (messaging cut)

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 03 — Core list/send + sliding window  
**Branch:** `agent/messaging-15-polls`  
**Spec:** [conversation.md](../../../docs/ui-surfaces/conversation.md), [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)

**What to build:** Poll embed create/vote as a **separate** messaging-cut slice (composer insert + message embed). Keep domain minimal; align contracts when adding.

**Owns:** poll schema + API + composer poll insert + message poll render.

**Must not touch:** scheduling; attachments graph (unless poll has no files).

- [ ] Create poll from composer; persists with message or as embed id
- [ ] Vote updates; realtime optional
- [ ] PR `[messaging 15] …`

## Comments

Spec details thinner than other domains — grill or expand contracts in-PR if needed; do not block attachments/schedule.
