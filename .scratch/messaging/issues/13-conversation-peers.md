# 13 — conversation_peer expand–contract

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 03 — Core list/send + sliding window  
**Branch:** `agent/messaging-13-conversation-peers`  
**Spec:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md), [ARTIFACTS-AND-SPACES.md](../../../docs/ARTIFACTS-AND-SPACES.md)

**What to build:** Migrate DM identity from `conversation_member` to fixed **`conversation_peer`**: expand (new table + dual-read), migrate rows, switch ACL checks, contract (drop old). Sidebar **hide** preference table if missing.

**Owns:** schema migration expand/contract; ACL helpers for direct; OpenOrCreateDirectConversation dedupe by peer set; hide preference.

**Must not touch:** message body/list logic beyond ACL import; attachments.

- [ ] Expand: conversation_peer (+ optional dm_sidebar_preference) exists beside member
- [ ] Backfill peers from members for directs
- [ ] Access checks use peer ∩ workspace
- [ ] Dedupe key (root_space_id, sort(peer ids)) unchanged in spirit
- [ ] Contract: remove conversation_member for directs (or whole table if unused)
- [ ] No “leave DM”; hide-only for sidebar
- [ ] PR `[messaging 13] …` (may be multiple PRs expand / migrate / contract — note in body)

## Comments

Wide refactor — keep CI green via expand–contract; integration branch OK if needed.
