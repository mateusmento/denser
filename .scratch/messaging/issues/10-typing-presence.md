# 10 — Typing + presence

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 03 — Core list/send + sliding window  
**Branch:** `agent/messaging-10-typing-presence`  
**Spec:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md), [conversation.md](../../../docs/ui-surfaces/conversation.md)

**What to build:** **Typing** indicators in the conversation (pulse + TTL) and **presence**: conversation viewer avatars in header **and** workspace online green dots on **1:1 DMs + members** (not group DM rows).

**Owns:** typing/presence socket events; composables; header/avatar UI wiring; member-list dots.

**Must not touch:** message list SQL; attachments; scheduler.

- [ ] Typing start/stop with TTL prune; banner near composer
- [ ] Conversation viewers reflected in header avatars
- [ ] Workspace online dots on 1:1 DM rows + space members; **no** group DM row dots
- [ ] PR `[messaging 10] …`

## Comments

Can start once 03 exposes a stable conversation room join for sockets.
