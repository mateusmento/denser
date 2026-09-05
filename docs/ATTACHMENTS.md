# Attachments

**Status:** Draft (architecture; cross-cutting — implement as its own cut)  
**Touches:** Conversations, Scheduling, Meetings (recordings), Documents (later), composer upload UI  
**Drafts product:** [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md)  
**Storage port:** already locked in Conversations — **S3 + R2** adapters, progressive upload + **cancel**  
**Sources:** epicstory ADR-0001 / ADR-0002; Slack-like “files shared in channel”; denser messaging cut  

Attachments are **not** owned exclusively by a Message row. They are a **workspace blob pool** plus a **reference graph**: many parents (draft, scheduled job, message, later document / meeting recording) can point at the same blob. Scheduling and messaging both depend on this — do not invent a second staging system inside Schedule.

---

## Decisions (architecture)

| Decision | Choice | Rejected / why |
| --- | --- | --- |
| Ownership | **Blob row** in workspace pool; parents hold **joins** | Exclusive `message_id` FK on the file (epicstory pre-redesign pain) |
| Scope of pool | Per **workspace** (`root_space_id`); conversation **files pane** lists delivered shares in that conversation | Global user drive as v1 SoT; file owned by one message forever |
| Orchestration seam | Single **AttachmentReferences** module: `commit` (`sync` / `release` / `releaseAttachment` / `reclaim`) + `load` | Parallel `associateToMessage` / `associateToSchedule` clones on storage service |
| Storage | App **BlobStore port**; adapters **S3** + **R2**; progressive + cancel | Vendor SDK in feature code; URLs as SoT |
| Staging parent | **MessageDraft** (and scheduled job) as first-class anchors | Orphan blobs with no parent; “staging” table parallel to refs |
| Schedule + files | Job holds joins — [SCHEDULING.md](./SCHEDULING.md) | Attachment ids only in job JSON |
| GC | Delete blob when **join refcount = 0** (and not protected) + grace; separate **object-store orphan** sweep | GC from TipTap alone; one cron that mixes join GC and S3 orphans |
| Remove semantics | Composer **edit-remove** = `sync` current anchor; intentional destroy = `releaseAttachment` (all joins) | One “delete” API that always nukes shared files |
| Media library | **Deferred** — upload-new first; pick-existing later | Block messaging on library |
| Document / issue media | Later parents on same graph; do not special-case exclusive FKs again | Separate upload stacks forever |

---

## Mental model (Slack-like)

```text
Upload → create Blob in workspace pool + join to Draft (staging)
     → Send     → sync joins to Message; release Draft
     → Schedule → sync joins to ScheduledJob; release Draft
           → Fire → sync joins to Message; once-job release Scheduled joins
     → Conversation “Files” pane = blobs with delivered Message (or thread) joins
```

Same file id can appear as:

- Composer **tile** (join − inline image nodes)
- TipTap **image** node (`attachmentId` / host URL from blob)
- Scheduled message preview tiles
- Delivered message attachments
- Channel/conversation file browser

---

## Domain model

```text
Workspace (root_space_id)
  └── Attachment (blob metadata + storage_key)
        └── AttachmentReference* → anchors:
              draft | scheduled_job | message | (later: document, meeting_recording, …)

Conversation
  └── MessageDraft? (per author × conversation × thread?)
  └── Message* ──joins──► Attachment
ScheduledJob (scheduled_message) ──joins──► Attachment
```

### Objects

| Object | Role |
| --- | --- |
| **Attachment** | Immutable-ish blob metadata: key, size, mime, filename, uploader, workspace |
| **Attachment reference** | Join: attachment ↔ parent anchor |
| **Anchor** | Typed parent: `{ type, id }` |
| **MessageDraft** | Composer staging parent (TipTap + joins); TTL / purge releases joins |
| **BlobStore** | Port: create multipart/progress, abort, signed/get URL, delete object |

### Anchors (v1)

| Anchor | When |
| --- | --- |
| `draft` | Upload from composer before send/schedule |
| `scheduled` | Scheduled message job holds files until fire (recurring keeps them) |
| `message` | Delivered main or thread message (`thread_id` on message — no separate reply table required) |

Later: `document`, `meeting_recording`, `meeting_material`.

---

## Lifecycle

### Upload

1. Client starts progressive upload via BlobStore (cancel ⇒ abort multipart / delete partial).
2. Server creates **Attachment** row (`root_space_id`, `uploaded_by`, optional `conversation_id` for listing hints).
3. Ensure **MessageDraft** for `(conversation, author[, thread])`.
4. `commit({ op: 'sync', anchor: draft, attachmentIds: existing ∪ new })`.

### Send (live)

1. Create Message.
2. `sync` message anchor with attachment ids (union of tiles + inline image ids from TipTap).
3. `release` draft anchor (or delete draft).
4. Eager GC if any id now unreferenced.

### Schedule

1. Create/update ScheduledJob ([SCHEDULING.md](./SCHEDULING.md)).
2. `sync` scheduled anchor — **do not** treat payload JSON as ref SoT.
3. Release draft.
4. Fire: `load` scheduled → PostMessage with ids + `trustedDelivery` → once: `release` scheduled; recurring: keep.

### Intentional destroy (files pane / hard remove)

`releaseAttachment(id)` — strip **all** joins, then GC. Distinct from “remove from this draft/message.”

### Maintenance

| Job | Role |
| --- | --- |
| **Reclaim** | Hourly: attachments with zero joins past grace → delete row + object |
| **Orphan sweep** | Hourly: storage keys with no DB row → delete object |
| **Draft purge** | Expired drafts → release joins |

Name them accurately (epicstory’s “AttachmentStagingCronjob” was S3-only — confusing).

---

## Storage port

| Operation | Notes |
| --- | --- |
| `upload` / multipart | Progress events to client; **cancel** aborts |
| `getUrl` | Signed or public policy per deploy |
| `delete` | After GC decides blob is dead |
| Adapters | **AWS S3**, **Cloudflare R2** |

Message / TipTap SoT stores **attachment ids** (and/or stable app URLs derived from id) — not raw vendor URLs as the only reference.

---

## Reference API (seam)

```text
commit({ op: 'sync' | 'release' | 'releaseAttachment' | 'reclaim', … })
load(anchor) → Attachment[]
listDeliveredForConversation(conversationId) → files pane
```

| Op | Meaning |
| --- | --- |
| `sync` | Make joins for this anchor exactly `attachmentIds` (add/remove) |
| `release` | Drop all joins for this anchor |
| `releaseAttachment` | Drop this attachment from **every** anchor |
| `reclaim` | GC unreferenced blobs past grace |

**Eligibility:** workspace match; optional conversation match; uploader match unless **`trustedDelivery`** (schedule fire / system).

Pure predicates (eligible / gcable) stay separate from I/O — epicstory `attachment-reference.rules.ts` pattern.

---

## UI implications

| Surface | Behavior |
| --- | --- |
| MessageComposer | Stage tiles; upload → draft joins; Send/Schedule pass ids |
| Inline images | TipTap node refs attachment id; tiles = joins − ids already in doc |
| Conversation files | List delivered joins (Slack channel files); delete = `releaseAttachment` with confirm |
| Scheduled list | Hydrate from `load(scheduled)` |
| Recording | Must **upload + attach** (Meeting and/or Message anchor) — not download-only. **Messaging composer:** Loom-style setup + circular webcam — [SCREEN-RECORDING.md](./SCREEN-RECORDING.md) |

---

## Features (catalog) — implement as Attachments cut

| # | Slice | Unblocks |
| --- | --- | --- |
| **A0** | BlobStore port + S3/R2 adapters + Attachment row | Any upload |
| **A1** | References module + draft/message anchors + reclaim/orphan | Live attach send |
| **A2** | Scheduled anchor + fire path with Scheduling S1 | Schedule + files |
| **A3** | Conversation files pane | Slack-like browse/delete |
| **A4** | Meeting recording anchor | Meetings M3 |
| **A5** | Media library / pick existing | Nice-to-have |
| **A6** | Document body anchors | Docs parity |

Conversations messaging cut item “Attachments / images” **is A0–A1**. Schedule with files needs **A2** + [SCHEDULING.md](./SCHEDULING.md) S1.

---

## Data schema (conceptual)

### Attachment

| Field | Notes |
| --- | --- |
| id | AttachmentId |
| root_space_id | Pool boundary |
| conversation_id | Optional hint for upload context / listing |
| uploaded_by | |
| storage_key | Opaque |
| mime_type / original_filename / byte_size | |
| created_at | |

No exclusive `message_id`.

### Join tables (or single polymorphic refs)

| Parent | Notes |
| --- | --- |
| message_attachments | Delivered |
| message_draft_attachments | Staging |
| scheduled_job_attachments | Schedule template |

Prefer explicit joins (queryable, FK-safe) over a single opaque polymorphic table unless tooling strongly prefers one.

### MessageDraft

Full product rules: **[MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md)**. Attachment-relevant fields:

| Field | Notes |
| --- | --- |
| id | DraftId — attachment anchor |
| conversation_id / author_id / thread_id? | Unique active draft key |
| body | TipTap JSON (may embed image attachment ids) |
| version / expires_at | Upsert + purge |

---

## Constraints

1. Never store attachment id lists **only** in ScheduledJob / draft JSON as the GC SoT.
2. Never GC a blob with remaining joins.
3. `trustedDelivery` only on internal schedule/system paths.
4. Composer “remove tile” must `sync` the **current** anchor — not `releaseAttachment` — when the file may still be on a schedule or another message.
5. TipTap image nodes and tile strip share ids carefully on send (union).
6. Cancelled uploads must not leave unreclaimable orphans (best-effort delete + orphan sweep).

---

## Lessons from epicstory (pain → denser rule)

| Pain | Rule |
| --- | --- |
| Exclusive FKs couldn’t express draft → schedule → message | Pool + M2M from day one |
| Associate/GC sprawl on workspace service | One AttachmentReferences seam |
| JSON-only ids on schedule | Joins required |
| Parallel “staging attachment” table | Draft is an anchor |
| `releaseAttachment` vs edit-remove confusion | Two ops; document in UI |
| Misnamed staging cron = S3 orphan only | Split reclaim vs orphan; name clearly |
| Frontend dual-write / tiles=joins−doc incomplete | Spec drafts in [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md); denser v1 = server-authoritative |
| Issue `issue_id` immortal rows | If denser adds document media, put it on the **same graph** — don’t invent a second immortal FK trap |

---

## Out of scope (initial)

- Full Drive / personal file manager
- Virus scan pipeline (hook later)
- Cross-workspace file share
- CRDT co-editing of drafts

---

## Open questions

- Max size / mime allowlists (numbers).
- Whether `conversation_id` on Attachment is required for files-pane indexing or derived only via joins.
- Soft-deleted messages: keep joins for history vs release and hide in files pane.
- Draft product open questions → [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md).

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-04 | Point MessageDraft product rules at MESSAGE-DRAFTS.md; lock server-authoritative. |
| 2026-09-04 | Initial Attachments domain: workspace pool + reference graph; schedule/message/draft anchors; cut A0–A6. |
