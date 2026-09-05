# Feature Specs

**Status:** Draft scaffold — specify product features as **core objects**, **data shapes**, **behaviors**, and **constraints**. UI layout and chrome live under [ui-surfaces/](./ui-surfaces/) (catalog: [UI-SURFACES.md](./UI-SURFACES.md)).

**Audience:** Product, backend, and frontend when agreeing what a feature _is_ before (or while) building it.

**Related:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) (v1 filing model), [CONVERSATIONS.md](./CONVERSATIONS.md), [MEETINGS.md](./MEETINGS.md), [SCHEDULING.md](./SCHEDULING.md), [ATTACHMENTS.md](./ATTACHMENTS.md), [MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md), [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md), [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md), [WORKFLOW.md](./WORKFLOW.md), [DOCUMENT-TYPES.md](./DOCUMENT-TYPES.md), [PRODUCT-MODEL.md](./PRODUCT-MODEL.md) / [ONTHOLOGY.md](./ONTHOLOGY.md), [VISUAL-LANGUAGE.md](./VISUAL-LANGUAGE.md), `@denser/contracts`.

Deep domain specs (decisions, commands/queries, constraints) live in dedicated files — **FEATURE-SPECS** is the **index** for those plus smaller features still drafted inline.

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

| Feature                                | Status | Objects (summary)                                                            | Full spec / UI |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------- | -------------- |
| [Conversation](#conversation)          | Active | Conversation, Message, Quote, Thread, …                                      | **[CONVERSATIONS.md](./CONVERSATIONS.md)** · [conversation.md](./ui-surfaces/conversation.md) |
| [Meeting rooms](#meeting-rooms)        | Draft  | Meeting room, Meeting, Attendee                                              | **[MEETINGS.md](./MEETINGS.md)** · UI TBD |
| [Scheduling](#scheduling)              | Draft  | ScheduledJob, scheduled message, meeting jobs                              | **[SCHEDULING.md](./SCHEDULING.md)** |
| [Attachments](#attachments)            | Draft  | Attachment pool, references, draft/schedule/message anchors                 | **[ATTACHMENTS.md](./ATTACHMENTS.md)** |
| [Message drafts](#message-drafts)      | Draft  | MessageDraft (composer staging)                                            | **[MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md)** |
| Document                               | Active | Artifact(document), body, …                                                  | [document.md](./ui-surfaces/document.md) |
| Spaces & membership                    | Active | Space, Membership, Invite                                                    | Shell, home, invites, space tabs |
| [Backlog & sprints](#backlog--sprints) | Draft  | Space views, sprint child spaces                                             | [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md) · backlog/board surfaces |
| [Workflow](#workflow)                  | Draft  | Workflow, stages, kinds                                                      | [WORKFLOW.md](./WORKFLOW.md) |
| [Document types](#document-types)      | Draft  | Document type templates                                                      | [DOCUMENT-TYPES.md](./DOCUMENT-TYPES.md) |

---

## Conversation

| Field            | Value |
| ---------------- | ----- |
| Status           | Active (shell + UI shipped; messaging phased) |
| Full domain spec | **[CONVERSATIONS.md](./CONVERSATIONS.md)** — decisions, model, features, commands/queries, constraints, events, quote preview, messaging cut |
| Owner surface(s) | [ui-surfaces/conversation.md](./ui-surfaces/conversation.md); engine: [rich-text-composer.md](./ui-surfaces/rich-text-composer.md) |
| Filing           | [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) — `kind = conversation` |
| v1 scope         | Regular + direct artifacts; messaging with quotes ∥ threads; virtualized cursor windows |

This index entry is a pointer. Do not duplicate the Conversations domain here.

---

## Meeting rooms

| Field            | Value |
| ---------------- | ----- |
| Status           | Draft (not in conversation messaging cut) |
| Full domain spec | **[MEETINGS.md](./MEETINGS.md)** — decisions, model, features, commands/queries, SFU architecture, phasing M0–M3, lessons vs epicstory |
| Owner surface(s) | TBD `ui-surfaces/meeting-room.md` |
| Filing           | [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) — `kind = meeting_room` |
| v1 scope         | Meeting room artifact + Meeting instances; media via **SFU** |

This index entry is a pointer. Do not duplicate the Meetings domain here.

---

## Scheduling

| Field            | Value |
| ---------------- | ----- |
| Status           | Draft |
| Full domain spec | **[SCHEDULING.md](./SCHEDULING.md)** — ScheduledJob runner, scheduled messages, meeting start/reminder jobs |
| Owner surface(s) | Conversation composer / schedules UI; Meeting room schedule |
| v1 scope         | Postgres job claim + once scheduled messages; meeting jobs with Meetings phasing |

This index entry is a pointer. Do not duplicate the Scheduling domain here.

---

## Attachments

| Field            | Value |
| ---------------- | ----- |
| Status           | Draft |
| Full domain spec | **[ATTACHMENTS.md](./ATTACHMENTS.md)** — workspace blob pool, reference graph, draft/schedule/message anchors, A0–A6 cut |
| Owner surface(s) | Conversation composer, files pane; later documents / meeting recordings |
| v1 scope         | BlobStore S3+R2; draft + message joins; scheduled joins with Scheduling |

This index entry is a pointer. Cross-cuts Conversations and Scheduling — implement as its own cut.

---

## Message drafts

| Field            | Value |
| ---------------- | ----- |
| Status           | Draft |
| Full domain spec | **[MESSAGE-DRAFTS.md](./MESSAGE-DRAFTS.md)** — server-authoritative composer drafts; attachment staging parent |
| Owner surface(s) | [ui-surfaces/conversation.md](./ui-surfaces/conversation.md) MessageComposer |
| v1 scope         | Get/Upsert/Delete; hydrate on open; clear on send/schedule; TTL purge; no dual-write / no drawer |

This index entry is a pointer. Do not duplicate the Message drafts domain here.

---

## Backlog & sprints

| Field            | Value                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Status           | Draft                                                                                                                                      |
| Owner surface(s) | [backlog.md](./ui-surfaces/backlog.md), [board.md](./ui-surfaces/board.md); chrome: [shell.md](./ui-surfaces/shell.md)                     |
| v1 scope         | Independent Backlog and Board space views; Board needs workflow + stage; opt-in sprint clock as child spaces; project/Kanban/Scrum presets |

**Product model:** [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md), [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md). Filing: [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md). Workflow: [WORKFLOW.md](./WORKFLOW.md). Types: [DOCUMENT-TYPES.md](./DOCUMENT-TYPES.md).

### Core objects

| Object   | Role                                                            |
| -------- | --------------------------------------------------------------- |
| Space    | Organizational asset; may have Backlog, Board, and/or sprinting |
| Sprint   | Child space with role upcoming / active / past                  |
| Document | Rows on Backlog; cards on Board if they have a stage            |
| Workflow | Ordered stages + transition rules on the space that has Board   |

### Data schema (conceptual)

- **Space:** backlog view on/off; board view on/off; sprinting on/off; optional workflow; if sprinting: `activeSprintId`, `upcomingSprintId`, planned length, sprint number
- **Sprint space:** role; planned period; `startedAt`; `completedAt`
- **Document:** `space_id`; rank within that space; optional stage (workflow)
- **Relations:** sprint parent = the space with sprinting on; Backlog drag between sections changes `space_id`
- **Identity / versioning:** existing space and artifact ids / versions

### Behaviors

| Behavior                           | Trigger                              | Result                                                                                               |
| ---------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Create from preset                 | New folder / project / Scrum project | Space with the matching views, workflow, and sprinting                                               |
| Enable Backlog / Board / sprinting | `canManage`                          | That capability on; views pick up sprinting if it is already on                                      |
| Enable sprints                     | `canManage`                          | First upcoming child; Backlog (if on) grows sections; Board (if on) scopes to active when one exists |
| Start                              | `canManage`, no active               | Upcoming → active; new upcoming created                                                              |
| Complete                           | `canManage`, active exists           | Active → past; leftovers stay unless moved                                                           |
| Drag on backlog                    | Drop on another section              | Move `space_id` + rank (only when sprint sections exist)                                             |
| Drag on board                      | Drop on a column                     | Stage change if the transition is allowed                                                            |

### Constraints

- Backlog and Board do not require sprinting
- Board requires a workflow; only documents with a stage appear as cards
- At most one active and one upcoming; start is invalid while an active exists
- No Backlog stage kind — unscheduled work is documents on the parent space
- Only documents on these views; sprint children are public nested
- Enable / start / complete = `canManage`

### Out of scope (v1)

- Linear-style automatic cycle roll
- Full custom workflow editor (presets + default stages are enough)
- Disabling sprinting
- Sprint or Project as a type

### Open questions

- Automatic cycles later
- Disabling sprints after enable

---

## Workflow

| Field            | Value                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Status           | Draft                                                                                               |
| Owner surface(s) | [board.md](./ui-surfaces/board.md)                                                                  |
| v1 scope         | Space-scoped workflows; kinds without Backlog; allowed sources; Kanban and Scrum transition context |

**Product model:** [WORKFLOW.md](./WORKFLOW.md), [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md).

### Core objects

| Object   | Role                                         |
| -------- | -------------------------------------------- |
| Workflow | Ordered stages owned by the project space    |
| Stage    | Name, kind, allowed sources                  |
| Document | `stageId` when the type has a Workflow field |

### Data schema (conceptual)

- **Workflow:** id, name, `spaceId`, stages[]
- **Stage:** id, name, kind (`idle` \| `in_progress` \| `blocked` \| `settled` \| `cancelled`), allowedSourceStageIds
- **Relations:** document types reference a workflow; documents store `stageId`
- **Identity:** stage id is stable across rename

### Behaviors

| Behavior           | Trigger                                   | Result                                                          |
| ------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| Define / duplicate | `canManage`                               | New workflow on the space                                       |
| Transition         | Board drag or stage picker                | New stage if allowed for this location                          |
| Reopen             | Explicit action                           | First idle stage; move off a past sprint onto the project space |
| Auto-block         | blocked-by link and a Blocked kind exists | Document moves to Blocked stage                                 |

### Constraints

- No Backlog kind
- Dead-end check on save
- Settled rollback only while the document is on the Board (Kanban space or active sprint)
- `canManage` to edit workflows; space access to transition

### Out of scope (v1)

- Visual transition graph
- Team-scoped workflows
- Requiring an active sprint to transition

---

## Document types

| Field            | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Status           | Draft                                                                                   |
| Owner surface(s) | [document.md](./ui-surfaces/document.md)                                                |
| v1 scope         | Space-scoped types on document artifacts; builtins Issue / Spec / Doc; in-place convert |

**Product model:** [DOCUMENT-TYPES.md](./DOCUMENT-TYPES.md). Filing: artifact `kind = document`.

### Core objects

| Object        | Role                                                  |
| ------------- | ----------------------------------------------------- |
| Document type | Template of extra fields + optional Workflow / Prefix |
| Document      | Artifact shell + body + type + extra field values     |

### Data schema (conceptual)

- **Document type:** id, name, `spaceId`, builtin flag, field definitions
- **Document (extend):** `documentTypeId`, `stageId`, extra `fields`, `rank`, optional `identifier`
- **Prefix:** `{spaceKey}-{n}` on the project space, not a Project entity

### Behaviors

| Behavior                   | Trigger         | Result                                                 |
| -------------------------- | --------------- | ------------------------------------------------------ |
| Define / clone / edit type | `canManage`     | Type on the project space                              |
| Create document            | User in a space | Type default by context; first idle stage if trackable |
| Convert type               | User            | In-place; keep id; remap or prompt stage               |

### Constraints

- Not extra artifact kinds
- Cannot delete builtins
- Sprint children do not own types

### Out of scope (v1)

- Archive + 30-day auto-delete
- Epics
- Full labels catalog if not needed for Issue builtin

---

## Changelog

| Date       | Change                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04 | Add MESSAGE-DRAFTS.md index (server-authoritative composer drafts). |
| 2026-09-04 | Add SCHEDULING.md + ATTACHMENTS.md index entries (job runner; workspace attachment pool). |
| 2026-09-04 | Grill locks written into CONVERSATIONS.md / MEETINGS.md (peers, LiveKit, lobby panel, layouts). |
| 2026-09-04 | Meeting rooms expanded: SFU, lifecycle, epicstory/epicstory2 comparison, phasing M0–M3. |
| 2026-09-04 | Conversation + Meeting rooms moved to CONVERSATIONS.md / MEETINGS.md; this file indexes. |
| 2026-09-04 | Quoted preview: ~1k text chars + byte ceiling; strip images; `displayContent` for Inbox. |
| 2026-09-04 | Quoted preview: size/footprint cap on wire; UI max-h + gradient (no line budgets). |
| 2026-09-04 | Quoted preview DTO: smart-truncated TipTap JSON + truncated flag / gradient UI. |
| 2026-09-04 | Quote join-on-read; Slack-like unread divider; no multi-peer DM presence dots. |
| 2026-09-04 | Meeting room artifact vs Meeting instance; both presence scopes; message grouping 5 min / day. |
| 2026-09-04 | Conversation: lock jump pill, thread split/full-replace, typing/presence, attach-only send; poll/recording/schedule as separate messaging-cut tasks. |
| 2026-09-04 | Conversation messaging: quotes ∥ threads; list `next`/`prev`/`around`; virtualized sliding window; `client_id` optimism. |
| 2026-08-10 | Scaffold + Conversation draft.                                                                                                        |
| 2026-08-10 | Align with MessageComposer: rich body, schedule/poll phased objects, schedule permission note.                                        |
| 2026-08-11 | Lock message `body` as TipTap / ProseMirror JSON.                                                                                     |
| 2026-08-26 | Conversation as Artifact kind; regular/direct kinds; DM dedupe within root space; space tabs.                                         |
| 2026-08-28 | Space visibility is the membership gate; private → public is not a feature. See [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md). |
| 2026-08-28 | Backlog & sprints conception: sprints as spaces, opt-in clock, backlog/board views.                                                   |
| 2026-08-29 | Backlog, board, and sprinting are independent; project presets; Board does not require sprints.                                       |
| 2026-08-29 | Workflow + document types from Epicstory, mapped onto Space/Artifact domains.                                                         |
