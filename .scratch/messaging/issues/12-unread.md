# 12 — Unread badges + New divider + mark-read-on-open

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 03 — Core list/send + sliding window  
**Branch:** `agent/messaging-12-unread`  
**Spec:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md), [conversation.md](../../../docs/ui-surfaces/conversation.md)

**What to build:** Nav/header **unread badges**, Slack-like **New** divider, open with unread lands near divider (`around` first unread), **mark read to latest on open**.

**Owns:** read_state API; unread summary query; divider UI; open/land behavior; mark-read-on-open.

**Must not touch:** attachment/schedule modules.

- [ ] Persist last_read per user × conversation
- [ ] Badge counts on conversation/DM list
- [ ] New divider between last-read and first unread
- [ ] Open with unread → around first unread; caught up → pin latest
- [ ] On open, advance last_read to latest (debounced OK)
- [ ] Jump-to-latest pill still works when scrolled away
- [ ] PR `[messaging 12] …`

## Comments

Jump pill may already exist in UI — wire visibility to live-edge state from 03.
