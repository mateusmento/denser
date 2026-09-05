# Conversations

**Status:** Active (shell + UI shipped; messaging phased)  
**Filing:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) — Artifact kind `conversation`  
**UI:** [ui-surfaces/conversation.md](./ui-surfaces/conversation.md)  
**Composer engine:** [ui-surfaces/rich-text-composer.md](./ui-surfaces/rich-text-composer.md)  
**Frontend window pattern:** [FRONTEND-ARCHITECTURE.md](./FRONTEND-ARCHITECTURE.md); FA ADR `0012-chat-window-and-quotes`  
**Sources:** epicstory channels; frontend-architecture chat window; denser filing model  

**Related:** [SCHEDULING.md](./SCHEDULING.md) (scheduled messages / jobs) · [ATTACHMENTS.md](./ATTACHMENTS.md) (blob pool + refs) · [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md) · tasks [`.scratch/messaging/COVERAGE.md`](../.scratch/messaging/COVERAGE.md)

Conversation is the denser messaging domain: **regular** (space-filed) and **direct** (DM) artifacts, messages, quotes, threads, reactions, presence, and related messaging-cut objects. Voice/video lives in [MEETINGS.md](./MEETINGS.md), not here.

---

## Decisions (architecture)

| Decision | Choice | Rejected / why |
| --- | --- | --- |
| Place model | **Conversation artifact** (`regular` \| `direct`) | Epicstory Channel types (Group/DM/Meeting/Open) — Meeting must not be a conversation type |
| Quotes vs threads | **Both**; `quotes_id` ∥ `thread_id` | Treating them as alternatives |
| Message SoT body | TipTap / ProseMirror **JSON** | HTML strings / `v-html` |
| Quote SoT | `quotes_id` only; **join-on-read** preview DTO | Write-time quote snapshot as SoT |
| List shape | Cursor pages + **`next` / `prev` / `around`**; client **sliding window** + virtualization | Unbounded DOM history; unidirectional-only list |
| Optimism | Required **`client_id`** reconcile | Duplicate rows on HTTP + socket |
| Jump-to-latest | **Floating pill** (Floating UI) | Header-only control |
| Thread chrome | Desktop **split + resize + fade**; small **full-replace + fade** | Drawer-only (epicstory default) |
| Presence | **Conversation viewers** (header avatars) **and** **workspace online** (1:1 DM + members dots) | One signal only; green dots on group DM rows |
| Unread chrome | Nav **badges** + Slack-like **New divider** | Badge-only |
| Unread open | Land near **New** divider (`around` first unread) | Stay at latest by default |
| Mark read | **On open**, advance `last_read` to **latest** (Slack common default); no scroll-through required | Viewport-only mark-read for v1 |
| Quote preview wire | TipTap `body` (images stripped; **1000** text chars + **8 KiB** JSON ceiling) + plain **`displayContent`** (**160** chars) | Full TipTap always; server line budgets |
| Quote preview UI | RichTextPreview in **`max-h-40`** + bottom gradient on height overflow | `line-clamp` on rich card |
| Blob storage | App **port**; adapters **S3** + **R2**; see **[ATTACHMENTS.md](./ATTACHMENTS.md)** | App coupled to one vendor SDK; exclusive `message_id` on files |
| DM roster | Any **workspace** member | Nested-space-only roster |
| DM identity | Fixed **peer set** (not joinable membership); no “leave DM” | `conversation_member` leave semantics; Discord/Slack group-leave as product |
| DM sidebar remove | **Per-user hide** only; same peer set reopens on message | Hard-delete conversation on remove |
| Conversation archive | **Soft-archive** in v1 (workspace-wide; history kept) | User-facing hard delete of whole conversation in v1 |
| Leave workspace | Lose access to that workspace’s DMs; peer rows may remain for identity | “Leave conversation” as the exit path |
| Live calls | **Out** — [MEETINGS.md](./MEETINGS.md) | Epicstory channel-hosted calls |

---

## Domain model

```text
Space (ACL)
  └── Conversation artifact (regular)
        └── Message* (main stream + threads)
              ├── quotes_id → Message (same conversation)
              ├── thread_id → parent Message (side pane)
              ├── Reaction*
              ├── Attachment* (blob refs via storage port)
              └── quoted preview (join DTO, not stored)

Workspace (private root)
  └── Conversation artifact (direct)
        ├── conversation_peer*  (fixed peer set = identity + access)
        ├── per-user sidebar hide preference
        └── Message* (same message model)
```

### Objects

| Object | Role |
| --- | --- |
| **Conversation** | Artifact `kind = conversation` + row: `conversation_kind` (`regular` \| `direct`), intro, archival |
| **conversation_peer** | DM only — fixed peers the DM refers to; access = peer ∩ workspace member |
| **Message** | Post in main stream or thread |
| **Quote** | `quotes_id` pointer + join preview — not a thread |
| **Thread** | Side conversation via `thread_id` |
| **Reaction** | Emoji on a message |
| **QuotedPreview** | Join DTO (`body`, `displayContent`, …) — not a table SoT |
| **BlobObject** | Stored via storage port; message holds refs |
| **ScheduledMessage** | Messaging-cut: future send (+ recurrence) |
| **Poll** | Messaging-cut: structured poll |
| **Typing** | Ephemeral pulse (not persisted) |
| **ConversationPresence** | Who is viewing this conversation |
| **WorkspacePresence** | Who is online in the workspace (shell chrome) |
| **ReadState** | Per user×conversation `last_read` for badges + New divider |
| **DmSidebarPreference** | Per user×direct conversation: hidden from sidebar or not |

### Conversation kinds

| Kind | Listed in This Space | Access | Notifications |
| --- | --- | --- | --- |
| **Regular** | Yes | Space ACL (v1) | Channel-style |
| **Direct (DM)** | Never | Issuer is a **peer** and a **workspace member** | DM-style |

Users do **not** leave conversations. Regular access follows space membership. DMs are identified by peer set; peers do not “leave” the DM — they leave the **workspace** (lose access) or **hide** the DM from their sidebar.

**DM dedupe:** unique `(root_space_id, sort(peer_user_ids))`. Optional `space_id` = creation context only (omit from DM header v1). Picker: any member of that workspace.

---

## Features (catalog)

| Feature | Cut | Notes |
| --- | --- | --- |
| Create / rename / soft-archive regular conversation | Shell | Space create menu / tabs |
| Create / open DM | Shell | Find-or-create by peer set |
| Hide DM from sidebar | Shell | Per-user; reappears on new message / reopen |
| Soft-archive conversation | Shell | v1; history kept |
| List messages (cursor window) | Messaging | `next` / `prev` / `around` |
| Virtualized timeline + day + author groups | Messaging | 5 min same-author groups |
| Post / edit / delete message | Messaging | TipTap body; attach-only allowed |
| Quote + jump (`around`) | Messaging | Join preview DTO |
| Thread pane | Messaging | Split / full-replace |
| Reactions | Messaging | |
| Typing indicators | Messaging | |
| Conversation presence (header avatars) | Messaging | |
| Workspace presence (1:1 DM + members) | Messaging | No group-DM row dots |
| Unread badges + New divider | Messaging | Open → land at divider; mark read to latest |
| Jump-to-latest floating pill | Messaging | |
| Attachments / images | Messaging (task) | Storage port; progressive + cancel |
| Polls | Messaging (task) | |
| Schedule (+ recurrence) | Messaging (task) | |
| Screen recording → attach | Messaging (task) | Not download-only |
| Drafts (server-authoritative) | Messaging (task) | **[MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md)** — not epicstory dual-write |
| Search in conversation | Later | |
| Private regular channels (explicit members) | Later | |
| Hard-delete whole conversation | Later / compliance | Not v1 user chrome |

---

## Blob storage & attachments

Cross-cutting: **[ATTACHMENTS.md](./ATTACHMENTS.md)** (workspace pool, draft/schedule/message joins, reclaim).  
Composer staging: **[MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md)**.  
Scheduled send: **[SCHEDULING.md](./SCHEDULING.md)**.

Conversations depend on the BlobStore port (progressive upload + cancel; S3 + R2 adapters). Message rows store **attachment refs** via the reference graph — not vendor URLs as SoT.

---

## Data schema (conceptual)

### Conversation (extension)

| Field | Notes |
| --- | --- |
| artifact_id | PK → artifacts |
| conversation_kind | `regular` \| `direct` |
| intro | nullable |
| archived_at | nullable — soft-archive |

Artifact shell: `title`, `space_id`, `root_space_id`, `created_by`, version/timestamps.

### conversation_peer (direct only)

| Field | Notes |
| --- | --- |
| conversation_artifact_id | |
| user_id | Peer (not “member who joined”) |
| unique | `(conversation_artifact_id, user_id)` |

Peer set is immutable for dedupe identity in v1 (adding peers = different conversation / future “create new with expanded set”).

### DmSidebarPreference

| Field | Notes |
| --- | --- |
| user_id × conversation_artifact_id | |
| hidden | boolean |

### Message

| Field | Notes |
| --- | --- |
| id | MessageId |
| conversation_artifact_id | |
| thread_id | nullable — null = main stream |
| quotes_id | nullable — same conversation only |
| author_id | |
| body | TipTap JSON |
| client_id | nullable uuid — optimism |
| created_at / edited_at / deleted_at | |
| attachments | refs via [ATTACHMENTS.md](./ATTACHMENTS.md) — not exclusive FK |
| embeds | poll id, etc. TBD |

### ReadState

| Field | Notes |
| --- | --- |
| user_id × conversation_artifact_id | |
| last_read_message_id or last_read_at | For divider + badges |

### QuotedPreview (join DTO — not persisted as SoT)

| Field | Role |
| --- | --- |
| id | Quoted message id |
| author | id, name, avatar |
| body | TipTap JSON — **images stripped**; size-capped |
| displayContent | Plain text for Inbox — max **160** chars |
| sizeCapped | Optional; UI fade is **not** driven by this alone |
| hasAttachment | Optional |

**Server build:** strip images → heavy-node peek → cap **1000** text-node chars + **8 KiB** UTF-8 JSON → derive `displayContent` (≤160).

**Client timeline:** RichTextPreview on `body` in **`max-h-40`**; gradient if height exceeds. No line-clamp on rich card.

### Poll / Reaction

Payload shapes in `@denser/contracts`. **Scheduled messages** → [SCHEDULING.md](./SCHEDULING.md).

---

## Commands

| Command | Input (essentials) | Result / validation |
| --- | --- | --- |
| **CreateRegularConversation** | spaceId, title, issuer | Artifact + row; can create in space |
| **UpdateConversation** | conversationId, title/intro patch | Can manage; kind immutable |
| **ArchiveConversation** | conversationId | Soft-archive; can manage / policy |
| **UnarchiveConversation** | conversationId | |
| **OpenOrCreateDirectConversation** | rootSpaceId, peerUserIds[] | Peers ⊆ workspace; dedupe; find or create |
| **HideDirectConversation** | conversationId | Per-user sidebar hide |
| **UnhideDirectConversation** | conversationId | |
| **PostMessage** | conversationId, body?, quotesId?, threadId?, clientId, attachmentIds? | Can post; empty body ⇒ attachments required |
| **EditMessage** | messageId, body | Author (or moderator TBD) |
| **DeleteMessage** | messageId | Soft-delete; author / moderator |
| **ToggleReaction** | messageId, emoji | |
| **MarkRead** | conversationId, cursor = latest (typical on open) | Advances ReadState |
| **ScheduleMessage** | … | Messaging-cut |
| **CancelScheduledMessage** | … | |
| **CreatePoll** / **VotePoll** | … | Messaging-cut |
| **EmitTyping** | conversationId | Ephemeral |
| **UploadBlob** / **AbortUpload** | file, progress | Via storage port |

No **LeaveDirect** / remove-self-from-peers.

---

## Queries

| Query | Input | Result / validation |
| --- | --- | --- |
| **GetConversation** | conversationId | Shell + kind; 404/403 if no access |
| **ListSpaceConversations** | spaceId | Regular only; space ACL |
| **ListDirectConversations** | rootSpaceId | Peer’s DMs; respect sidebar hide filter |
| **ListMessages** | conversationId, size, cursor?, direction, around? | + `quoted`; access required |
| **GetMessage** | messageId | + quoted |
| **ListThreadMessages** | parentMessageId, … | |
| **ListScheduledMessages** | conversationId | |
| **GetUnreadSummary** | rootSpaceId or conversationIds | Badge counts |

### ListMessages contract

| Param | Role |
| --- | --- |
| size | Default ~20 |
| cursor | Opaque `(created_at, id)` |
| direction | `next` = older; `prev` = newer |
| around | Window containing MessageId (quote / unread jump) |

Default open with unread: **`around` first unread** + New divider. Mark read to latest on open (debounced).

---

## Constraints & validations

1. No read access ⇒ no message payloads (HTTP or socket).
2. No post access ⇒ no active composer / reject PostMessage.
3. Direct never in This Space / space gallery.
4. DM peers must be members of `root_space_id` at create/open; access requires still being a workspace member.
5. PostMessage: empty TipTap and no attachments/embeds ⇒ reject. Attachment-/image-only allowed.
6. `quotes_id` same conversation only; missing target ⇒ omit chrome.
7. `quotes_id` and `thread_id` independent.
8. Stable order: `created_at` + `id`.
9. Optimistic send requires `client_id`; reconcile HTTP + `message.created`.
10. Scheduled fire respects ACL at **fire time**.
11. Mentions resolve to permitted users (invalid handling TBD).
12. Uploads via storage port; size/type limits TBD; cancel must abort in-flight multipart.
13. No user “leave peers”; no hard-delete whole DM in v1 user chrome.

---

## Events / sync

| Event | Payload sketch |
| --- | --- |
| `message.created` | Message (+ quoted); match `client_id` |
| `message.updated` / `message.deleted` | |
| `reaction.updated` | |
| `typing` | conversationId, userId, until |
| `conversation.presence` | conversationId, viewers[] |
| `workspace.presence` | rootSpaceId, userId, online |
| `scheduled_message.upserted` | messaging cut |
| `read_state.updated` | optional fan-out |
| `conversation.archived` | soft-archive |

Prefer socket rooms for **conversations the user can read** (not only active tab).

---

## Messaging cut (task sequence)

Agent-executable tickets (api + app): **[`.scratch/messaging/COVERAGE.md`](../.scratch/messaging/COVERAGE.md)** — 29 tickets across Conversations, Attachments, Drafts, Scheduling.

| Wave | Tickets | Focus |
| --- | --- | --- |
| 0 | 01 | Scaffold (contracts + schema + ports) |
| 1 | 02–15 | Conversations: messages, quotes, threads, reactions, typing, unread, DM peers |
| 2 | 16–21 | Attachments: blobstore, refs, upload, composer/timeline UI, files pane |
| 3 | 22–23 | Drafts api + composer sync |
| 4 | 24–27 | Scheduling runner, schedule message, UI, recurrence |
| 5 | 28–29 | Polls, recording → attach |

Each ticket is **api**, **app**, or **full** — see matrix for reviewer-visible UI work.  

---

## Out of scope (this domain)

- Live A/V inside Conversation → [MEETINGS.md](./MEETINGS.md)
- Job runner / schedule due work → [SCHEDULING.md](./SCHEDULING.md)
- Attachment pool / GC → [ATTACHMENTS.md](./ATTACHMENTS.md)
- Cross-conversation search / quotes
- Full moderation queue / retention purge UI
- External webhooks
- Hard-delete entire conversation (v1)

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-05 | Full api+app task matrix (COVERAGE.md); 29 tickets replace backend-only pack. |
| 2026-09-04 | Message drafts → MESSAGE-DRAFTS.md (server-authoritative v1). |
| 2026-09-04 | Point schedule + attachments at SCHEDULING.md / ATTACHMENTS.md. |
| 2026-09-04 | Grill locks: peers (not leave), blob port S3+R2, unread open/mark-read, quote constants, soft-archive. |
| 2026-09-04 | Extracted full Conversations domain doc from FEATURE-SPECS / UI surface decisions. |
