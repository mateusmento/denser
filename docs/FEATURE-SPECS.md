# Feature Specs

**Status:** Draft scaffold — specify product features as **core objects**, **data shapes**, **behaviors**, and **constraints**. UI layout and chrome live under [ui-surfaces/](./ui-surfaces/) (catalog: [UI-SURFACES.md](./UI-SURFACES.md)).

**Audience:** Product, backend, and frontend when agreeing what a feature _is_ before (or while) building it.

**Related:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) (v1 filing model), [PRODUCT-MODEL.md](./PRODUCT-MODEL.md) / [ONTHOLOGY.md](./ONTHOLOGY.md) (broader vocabulary — prefer Artifacts & Spaces where they conflict), [VISUAL-LANGUAGE.md](./VISUAL-LANGUAGE.md), `@denser/contracts` (wire Zod once implemented).

---

## Purpose

A feature spec answers:

| Question                             | Section                                  |
| ------------------------------------ | ---------------------------------------- |
| What nouns exist?                    | Core objects                             |
| What fields / relations?             | Data schema (conceptual → later Zod/SQL) |
| What can happen?                     | Behaviors                                |
| What must never happen / edge rules? | Constraints                              |
| How does the user touch it?          | UI surfaces (link only)                  |

Keep specs **implementation-honest but UI-light**: name API/events when known; do not redesign the composer here.

---

## Entry template

```markdown
## <Feature name>

| Field            | Value                       |
| ---------------- | --------------------------- |
| Status           | Draft \| Active \| Deferred |
| Owner surface(s) | Links to UI-SURFACES        |
| v1 scope         | One sentence                |

### Core objects

| Object | Role |
| ------ | ---- |
| …      | …    |

### Data schema (conceptual)

- **Object:** fields (type, required, notes)
- **Relations:** …
- **Identity / versioning:** …

### Behaviors

| Behavior | Trigger | Result |
| -------- | ------- | ------ |
| …        | …       | …      |

### Constraints

- …
- Invariants: …
- Permissions: …

### Events / sync (if realtime)

- …

### Out of scope (v1)

- …

### Open questions

- …
```

---

## Index

| Feature                             | Status | Objects (summary)                    | UI surfaces                                                  |
| ----------------------------------- | ------ | ------------------------------------ | ------------------------------------------------------------ |
| [Conversation](#conversation) | Active | Conversation artifact, Message, Thread?, Reaction?, conversation_member (DM) | [ui-surfaces/conversation.md](./ui-surfaces/conversation.md) |
| Document                            | Active | Artifact(document), body, …          | [ui-surfaces/document.md](./ui-surfaces/document.md)         |
| Spaces & membership                 | Active | Space, Membership, Invite            | Shell, home, invites, space tabs                             |
| Workflow / Board                    | Deferred | Status, assignment, …              | Space-view tabs (backlog, board) — not artifacts             |

---

## Conversation

| Field            | Value                                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status           | Active (shell + UI shipped; messaging phased)                                                                                                        |
| Owner surface(s) | [ui-surfaces/conversation.md](./ui-surfaces/conversation.md) (MessageComposer); engine: [rich-text-composer.md](./ui-surfaces/rich-text-composer.md) |
| v1 scope         | Conversation **Artifact** with regular/direct kinds; CRUD shell + routed UI; persistent messages and membership tables phased in                     |

**Product model:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) — Conversation is an **Artifact kind**.

### Core objects

| Object                        | Role                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Conversation (artifact)**   | Thin shell (`kind = conversation`) + typed row: `kind` (`regular` \| `direct`), optional intro, archival flags    |
| **conversation_member** (DM)  | Explicit membership for **direct** conversations only — who can read/post                                           |
| **Message**                   | One post in a conversation (or thread); rich body                                                                   |
| **Thread** (optional v1)      | Side conversation anchored to a parent message                                                                      |
| **Reaction** (optional v1)    | Emoji (or short) reaction on a message                                                                              |
| **Poll** (phased)             | Structured poll embedded or referenced from a message                                                               |
| **ScheduledMessage** (phased) | Message payload + send-at / recurrence before it becomes a live Message                                             |

**Regular conversations** inherit **Space ACL** for read/post (v1). **Direct conversations** gate on **`conversation_member`** only and are listed in **Direct messages** nav for the root space, not in This Space.

### Data schema (conceptual)

**Conversation (artifact extension)**

- `artifact_id` (PK → artifacts, `kind = conversation`)
- `conversation_kind`: `regular` \| `direct`
- `intro` / description (nullable)
- archival flags (TBD)

Shell fields on **artifacts**: `title`, `space_id`, `root_space_id`, `created_by`, version/timestamps.

- **Regular:** `space_id` required (nested space parent). Listed in This Space when user has space access.
- **Direct:** `root_space_id` required for dedupe and DM nav. `space_id` optional (creation context only). Dedupe: unique `(root_space_id, sorted member user ids)`.

**conversation_member** (direct only)

- `conversation_artifact_id`
- `user_id`
- `joined_at` (TBD)
- unique `(conversation_artifact_id, user_id)`

**Message**

- `id`
- `conversation_artifact_id`
- `thread_id` (nullable)
- `author_id`
- `body` (TipTap / ProseMirror JSON document — not an HTML string)
- `created_at` / `edited_at` (nullable)
- `deleted_at` or soft-delete marker (TBD)
- attachments / images: list of refs (TBD)
- optional embeds: poll id, etc. (TBD)

**ScheduledMessage** (if phased in)

- payload equivalent to a Message draft
- `send_at`
- recurrence rule (nullable)
- status: `scheduled` \| `cancelled` \| `sent`

**Poll** (if phased in)

- `id`, options, votes, closes_at (TBD)

**Reaction** (if in v1)

- `message_id`, `user_id`, `emoji` (unique per user/message/emoji)

Wire schemas live in `@denser/contracts`; this section is the product contract.

### Behaviors

| Behavior                         | Trigger                                          | Result                                                                         |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Create regular conversation      | User with create permission in space             | Artifact + conversation row (`regular`); appears in This Space + can be tabbed |
| Create / open DM                 | User picks participants in root-space DM flow    | Find or create by `(root_space_id, sorted members)`; add to DM nav only        |
| Post message                     | Author with post permission submits via composer | Message persisted; appears in stream; realtime fan-out to authorized members   |
| Schedule message                 | Author confirms schedule options                 | ScheduledMessage stored; live Message created at fire time (or equivalent job) |
| Edit message                     | Author (or moderator — TBD)                      | Body updated; `edited_at` set; clients refresh                                 |
| Delete message                   | Author / moderator                               | Soft or hard delete per policy; UI shows tombstone or removal                  |
| Open thread                      | User acts on parent message                      | Thread created or focused; composer may target thread (thread shape)           |
| React                            | User toggles reaction                            | Reaction added/removed                                                         |
| Insert poll / recording / attach | Composer actions                                 | Creates/refs related objects or blobs per constraints                          |
| Read history                     | User opens conversation                          | Paginated or windowed history (cursor TBD)                                     |

### Constraints

- Users without read access never receive message payloads (HTTP or socket).
- Users without post access do not get an active composer (see UI surface states).
- **Direct conversations** never appear in space artifact listings (This Space gallery API/UI must filter `conversation_kind = direct`).
- **DM participants** must be members of the conversation’s **`root_space_id`**.
- Message `body` empty and no attachments / allowed embeds → reject send.
- Ordering: stable sort by `created_at` + `id` (or server sequence) so clients converge.
- Edits do not change message identity; history/audit TBD.
- Mentions resolve to existing users/members only (invalid mention handling TBD).
- Scheduled sends respect conversation permissions at **fire time**, not only at schedule time (policy TBD if membership changed).
- Screen recording / uploads subject to size, type, and permission limits (TBD).
- Notification profile follows **conversation kind** (`regular` vs `direct`).

### Events / sync

- Ingest path: prefer same canonical message model for HTTP and Socket.IO (see frontend architecture realtime notes).
- Suggested events (names TBD): `message.created`, `message.updated`, `message.deleted`, `reaction.updated`, `scheduled_message.upserted` (if phased).
- Clients apply events into the conversation replica; no second source of truth in the UI.

### Out of scope (v1)

- Cross-conversation search (maybe later)
- Voice/video calls (screen **recording** insert is separate and may still be phased)
- Full moderation queue
- External webhooks
- **`conversation_kind` / `conversation_member` in API** (schema + rules above are target; current code may be regular-only shell)

### Open questions

- Threads in v1 or defer?
- ~~Rich body format~~ → TipTap / ProseMirror JSON (locked).
- Which composer inserts ship in v1 vs later: poll, recording, recurrence?
- Attachment storage (R2 later vs defer)?
- DM create: strict nested-space roster vs any root member (recommend loose / Slack-like for v1).
- Leave root space / leave group DM semantics.

---

## Changelog

| Date       | Change                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 2026-08-10 | Scaffold + Conversation draft.                                                                 |
| 2026-08-10 | Align with MessageComposer: rich body, schedule/poll phased objects, schedule permission note. |
| 2026-08-11 | Lock message `body` as TipTap / ProseMirror JSON.                                              |
| 2026-08-26 | Conversation as Artifact kind; regular/direct kinds; DM dedupe within root space; space tabs. |
