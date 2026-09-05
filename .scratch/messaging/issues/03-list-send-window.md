# 03 — Core list/send + sliding window

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-03-list-send-window`  
**Spec:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md), [conversation.md](../../../docs/ui-surfaces/conversation.md), [FRONTEND-ARCHITECTURE.md](../../../docs/FRONTEND-ARCHITECTURE.md)

**What to build:** End-to-end users can open a conversation, load a **cursor page** of messages (`next`/`prev`/`around`), **post** a TipTap message with `client_id` optimism, and see it reconcile over HTTP/socket. Virtualized timeline binds to this API (wire existing presentational surface).

**Owns:** message list/send API handlers; message repository; conversation message sync composable; timeline data wiring.

**Must not touch:** BlobStore adapters (06), AttachmentReferences impl (07), drafts HTTP (08), scheduler (09), quote preview polish beyond stub null `quoted` (04), thread pane (05).

**Consumes:** MessageDto, ListMessagesQuery, PostMessageInput, socket events from 01; message table from 02. AttachmentIds on post may be accepted but refs sync can be TODO behind port no-op until 07.

- [ ] `ListMessages` supports size, cursor, direction next/prev, around
- [ ] `PostMessage` validates non-empty body **or** attachmentIds; persists; emits socket
- [ ] Optimistic UI reconciles by `clientId`
- [ ] Timeline uses sliding-window pattern (bounded pages); not unbounded DOM dump
- [ ] Access: regular = space ACL; direct = peer ∩ workspace (use existing member table until 13)
- [ ] Tests for list cursor + post happy path
- [ ] PR `[messaging 03] …`

## Comments

Quotes/threads can return empty/`threadId` support stubbed if 04/05 not merged — accept `quotesId`/`threadId` on write if columns exist.
