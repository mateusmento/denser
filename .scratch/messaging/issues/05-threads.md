# 05 — Threads pane + thread messages

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-05-threads`  
**Spec:** [conversation.md](../../../docs/ui-surfaces/conversation.md) thread layout, [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)

**What to build:** Users can **reply in thread**; ThreadPane lists thread messages; desktop **split + resize + fade**; small viewport **full-replace + fade**. Main stream still shows parent; quotes remain independent.

**Owns:** ListThreadMessages (or filter on threadId); thread open/close UI; ThreadPane container wiring; reply composer shape for thread.

**Must not touch:** main window virtualization core (03); attachment adapters; drafts server (can use local draft until 08).

**Consumes:** MessageDto.threadId; PostMessage with threadId from 03.

- [ ] Open thread from message action loads thread messages
- [ ] Reply posts with threadId = parent
- [ ] Desktop split + resize; small full-replace; fade-in
- [ ] Thread list does not share main around-focus window
- [ ] PR `[messaging 05] …`

## Comments

Coordinate composer chrome with 08 when both land — thread draft key includes thread_id.
