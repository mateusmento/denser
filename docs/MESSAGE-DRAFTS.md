# Message drafts

**Status:** Draft (architecture; product + attachment staging)  
**Touches:** [CONVERSATIONS.md](./CONVERSATIONS.md) (composer), [ATTACHMENTS.md](./ATTACHMENTS.md) (draft anchor), [SCHEDULING.md](./SCHEDULING.md) (clear on schedule)  
**UI:** [ui-surfaces/conversation.md](./ui-surfaces/conversation.md) (MessageComposer)  
**Sources:** epicstory `message_drafts`, ADR-0002, `app/.../draft.ts`  

A **Message draft** is the durable staging parent for an in-progress composer: TipTap body + attachment references **before** send or schedule. It is not a Message and not a ScheduledJob.

---

## Decisions (architecture)

| Decision | Choice | Rejected / why |
| --- | --- | --- |
| Durability | **Server `MessageDraft` row** as SoT when content or attachments exist | Local-only forever (breaks multi-device restore + attachment staging parent) |
| v1 sync model | **Server-authoritative**: debounce upsert; hydrate from server on open; **server wins** on conflict | Full epicstory **dual-write** (localStorage + server + 409 merge) — costly, unfinished UI |
| Offline | Keep typing in memory / optional local **cache**; next successful sync overwrites from server if row changed | Merge editors / CRDT in v1 |
| Uniqueness | One draft per **`(conversation, author, thread_root?)`** — main vs thread composers separate | One draft for whole conversation including all threads |
| Attachments | Draft is a first-class **attachment anchor** ([ATTACHMENTS.md](./ATTACHMENTS.md)) | Orphan blobs; ids only in draft JSON |
| Clear | Delete/release draft on **successful send** or **schedule** | Leave draft until TTL only |
| TTL | Sliding expiry on upsert (default **~72h**); purge cron releases joins then deletes row | Immortal drafts |
| Cross-conversation drawer / badge | **Defer** (APIs can exist later) | Block messaging cut on drafts inbox UX |
| Versioning | Optimistic **`version`** on upsert (409 → adopt server draft) | Blind overwrite |

---

## Domain model

```text
Conversation
  └── MessageDraft (author × conversation × thread_root?)
        ├── body (TipTap)
        ├── quotes_id? / poll? (optional fields)
        └── AttachmentReference*  (draft anchor)
```

### Objects

| Object | Role |
| --- | --- |
| **Message draft** | In-progress composer state for one author in one conversation (main or one thread) |
| **Draft key** | `(conversation_id, author_id, thread_id)` with `thread_id` null = main stream |

---

## Lifecycle

```text
Open composer → GET draft (hydrate) or empty
Type / upload → debounce PUT (bump version, slide expires_at; sync attachment ids)
Upload file   → ensureDraft → blob + sync draft joins ([ATTACHMENTS.md](./ATTACHMENTS.md))
Send          → PostMessage → release/delete draft
Schedule      → ScheduleMessage → release/delete draft
Idle / TTL    → purge cron → release joins → delete row
Empty body + no attachments → DELETE draft (or skip create)
```

### Hydration (v1)

1. Open conversation / thread composer.
2. `GetMessageDraft` → if present, set editor + tiles from `load(draft)` (tiles = joins − inline image ids in body).
3. If none, start empty (ignore stale local cache, or one-shot migrate local → server then clear local).

### Conflict (409)

Client sent stale `version`. Response includes current draft → **replace** editor state with server draft (toast optional: “Draft updated elsewhere”). No three-way merge in v1.

---

## Commands / queries

| API | Notes |
| --- | --- |
| **GetMessageDraft** | conversationId, threadId? → draft + attachments or null |
| **UpsertMessageDraft** | body, attachmentIds?, quotesId?, poll?, version; create with version `0` |
| **DeleteMessageDraft** | version? optional; send/schedule paths may delete without client version |
| **ListMessageDrafts** | workspace — **deferred** UI; optional for badge later |
| **CountMessageDrafts** | workspace — **deferred** |

Permissions: same as **can post** on the conversation. No draft for readers-only.

---

## Data schema (conceptual)

### MessageDraft

| Field | Notes |
| --- | --- |
| id | DraftId |
| root_space_id | Workspace |
| conversation_id | |
| author_id | |
| thread_id | null = main composer; else thread root message id |
| body | TipTap JSON |
| quotes_id | optional |
| poll | optional jsonb — when polls ship |
| version | int; bump on upsert |
| expires_at | sliding TTL |
| created_at / updated_at | |

**Unique:**

- `(conversation_id, author_id)` WHERE `thread_id IS NULL`
- `(conversation_id, author_id, thread_id)` WHERE `thread_id IS NOT NULL`

### Joins

`message_draft_attachments` — see [ATTACHMENTS.md](./ATTACHMENTS.md). Attachment id lists in the upsert body are **instructions to `sync`**, not the GC SoT by themselves.

---

## UI (v1)

| Surface | Behavior |
| --- | --- |
| MessageComposer (main / thread) | Hydrate on mount; debounce upsert (~300–500ms) while drafting |
| Failed send | Keep draft (already server or re-upsert); inline retry — [conversation.md](./ui-surfaces/conversation.md) |
| Empty composer | No row / delete existing draft |
| Drafts drawer / nav badge | **Out of v1** |
| Caption “Draft saved” | Optional muted affordance; not required |

Document composer drafts (pages) are **out of scope** here — different feature.

---

## Features (catalog)

| # | Slice | Notes |
| --- | --- | --- |
| **D0** | Schema + Get/Upsert/Delete + unique keys + version | |
| **D1** | Wire composer hydrate + debounce; clear on send | Messaging cut |
| **D2** | ensureDraft on upload + attachment sync | With Attachments A1 |
| **D3** | Clear on schedule | With Scheduling S1 |
| **D4** | TTL purge cron | With Attachments reclaim |
| **D5** | Workspace list/count + drawer/badge | Later |

---

## Constraints

1. At most one active draft per draft key.
2. Draft body alone must not be the only place attachment ids live for GC — joins required when files exist.
3. Send/schedule must not leave a stale draft that resurrects after post.
4. Purge must `release` draft attachment anchor before delete.
5. Readers cannot upsert drafts.
6. v1 does not implement epicstory-style dual-write merge.

---

## Lessons from epicstory

| Keep | Simplify / avoid in denser v1 |
| --- | --- |
| Server row + version + TTL + purge | Dual-write localStorage as equal SoT |
| Unique main vs thread drafts | — |
| Draft as attachment parent | Parallel staging table |
| Clear on send/schedule | — |
| tiles = joins − inline doc ids | — |
| List/count APIs for later drawer | Shipping unfinished drawer/badge as a blocker |

---

## Out of scope (v1)

- CRDT / multi-cursor co-authoring of a draft
- Cross-conversation drafts inbox UI
- Document / meeting notes drafts
- Full offline-first sync engine

---

## Open questions

- Exact TTL hours (72 vs other).
- Whether quote/poll fields ship on draft in D0 or when those features land.
- Optional local cache for offline: write-through hint only, or skip until D5+.
- Upsert while attachment upload in flight: wait for ids vs upsert body-only then sync joins.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-04 | Initial Message drafts domain: server-authoritative v1; defer dual-write and drawer. |
