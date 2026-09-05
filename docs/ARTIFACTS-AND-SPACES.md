# Artifacts & Spaces — v1 conception

Grilled decisions for Denser’s core model. This supersedes the polymorphic “Object / evolving Document” framing in older ontology notes for product direction going forward.

Planning (backlog, board, sprints, workflow, document types): [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md).

---

## Core nouns

### Artifact

A **thin shell** shared by typed subsystems — the filing and listing noun, **not** a customization engine.

Shell fields (conceptual):

- identity (`id`)
- kind (`document` | `conversation` | `meeting_room` | … later kinds)
- title
- location: parent Space (`space_id`, nullable for root) + `root_space_id` for tenancy indexing when inside a Space tree
- `createdBy`
- timestamps / version as needed

**Not shared across kinds:** content engines. Document, Map, Conversation, Meeting room, etc. are separate feature modules. You do not turn a Document into a Map by toggling capabilities.

### Space

A **membership, visibility, and ownership boundary**. Spaces nest. A Space can contain **child Spaces** and **Artifacts** as siblings (directory + files metaphor). Spaces are **not** Artifacts.

A **root space** is a Space with no parent. Visibility decides whether that root is a personal **folder** or a **workspace** — there is no separate Folder type.

**Public** means no membership gate: nested public spaces inherit access from the parent; a public root is visible only to **`createdBy`** (nothing to inherit). **Private** turns membership on: nested private spaces still require parent access, then an explicit member list; a private root is a workspace (invites, DMs, tenant `root_space_id`).

**Private → public is not a feature.** Public → private is a one-way promotion (folder → sealed room or personal folder → workspace).

### Space tabs

Every space has a **tab bar** — the single mechanism for “what am I looking at in this space?”

| Tab kind        | v1    | Role                                                                                                                                                                                    |
| --------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **This Space**  | Yes   | Always present (rename from “Gallery”). Browse **child spaces** and **regular artifacts** in the current space.                                                                         |
| **Pin**         | Next  | Shared shortcut to a **child space** or **regular artifact**. `canManage` only; no close; omit if the viewer cannot read the target. Direct conversations cannot be pins.               |
| **Working tab** | Yes   | Personal. A **document**, **regular conversation**, or **child space** this user opened. Closable. One fixed view per artifact kind — no view-mode picker.                              |
| **Space view**  | Later | **Backlog** / **board** — independent views, not artifacts. Sprinting is optional; Backlog grows sprint sections when it is on. See [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md). |

Bar order: **This Space** → **space views that are on** (Backlog, Board) → **pins** → **working tabs**.

The **`+`** on the tab bar adds **working tabs** (new document, new conversation, open child space). Backlog and Board are space views, not `+` items. Opening a child from `+` stays on this host’s bar; entering a child from the sidebar or This Space makes that child the host. A conversation opened from a tab is the same artifact as one listed in This Space — tabs are navigation, not a second object model.

### Personal home

**Not a Space.** The blank landing for a logged-in user: **public** root spaces they created, **private** root spaces they belong to, and **root** Artifacts they own. Nested Spaces/Artifacts stay under their parents so home does not become a dump.

---

## Location & tenancy

| Item            | Parent                 | Home?                                                                        |
| --------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Root Space      | none                   | Yes, if public and `createdBy` the user, or private and the user is a member |
| Nested Space    | another Space          | No — only under parent                                                       |
| Root Artifact   | none (`space_id` null) | Yes, if user owns it                                                         |
| Nested Artifact | a Space                | No — only when browsing that Space                                           |

Persist **`root_space_id`** alongside **`space_id`** on rows that live in a Space tree (tenant index). Root Artifacts have no Space parent; do not invent a fake Space row for personal home unless storage forces it later.

---

## Visibility

| Space                | Visibility                     | Access                                 | Behavior                                                               |
| -------------------- | ------------------------------ | -------------------------------------- | ---------------------------------------------------------------------- |
| **Root** (no parent) | **Public** (default on create) | `createdBy` only; no membership rows   | Personal folder on Home. Organize artifacts without a workspace.       |
| **Root**             | **Private**                    | Explicit members                       | Workspace / tenant. Invites, DMs, home-button name.                    |
| **Nested**           | **Public** (default)           | Inherit parent access                  | Folder inside a space. Optional extra member rows do not grant access. |
| **Nested**           | **Private**                    | Parent access **and** explicit members | Sealed room.                                                           |

Create-as-private nested: the creator becomes **owner** (not a copy of the whole root roster).

**Public → private:**

- Nested: copy the **root workspace** roster in as members so nobody already in the tree is locked out; if the creator is still missing, insert them as owner.
- Root: insert **owner** membership for `createdBy` (same as creating a private root today). Direct messages and workspace chrome apply after this.

**Private → public:** rejected. A workspace or sealed room cannot be turned back into a folder.

---

## Sharing & ACL

- **Root Artifacts:** owner-only. No member lists on free-floating files. To share, put the Artifact in a Space and invite.
- **In-Space Artifacts:** access from **Space roles / actions** only. Always persist **`createdBy`**. No separate Artifact-level ACL in v1 (applies to documents and **regular** conversations).
- **Direct conversations:** access from **peer set** ∩ **workspace membership** — not space gallery listing, not inherited from nested `space_id` context. See [CONVERSATIONS.md](./CONVERSATIONS.md).
- **Space ownership:** multi-owner supported where roles allow; persist **`createdBy`** and ownership/membership separately.

### Roles

| Role       | Where                                                | Notes                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**  | Private roots; creator of a new private nested space | Can do everything Admin can; unique **workspace** powers (e.g. delete that private root). **Break-glass** over the whole tree under that root: control/recovery (membership, visibility, delete nested Spaces) — **not** ambient Member read of every private child. Private nested content still needs membership or a deliberate Owner override. |
| **Admin**  | Root and nested                                      | Day-to-day control; on nested Spaces may delete that Space. Cannot delete a **root** Space.                                                                                                                                                                                                                                                        |
| **Member** | Root and nested                                      | Participate per action grants (create content, etc., as configured).                                                                                                                                                                                                                                                                               |

Permissions are **role-based plus action grants** (granular). Exact action matrices can be refined in implementation; the role split above is the product rule.

### Invites (v1)

- Invite to a Space with a role (Admin / Member; Owner only as a root promotion path).
- Pending invite → **accept / decline**.
- **In-app inbox** plus **email** when SMTP is configured (`sendSpaceInviteEmail`). Email is best-effort; inbox remains source of truth for pending state.

### Auth (v1)

- Credentials (username/password) for local/seed users via Better Auth.
- **Google OAuth** via Better Auth when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set.
- Users may have `email` and credential/OAuth accounts (Google-only accounts have no password).

---

## Conversations (artifact kind)

**Conversation** is an **Artifact kind** (`kind = conversation`). The message stream is a feature module; the shell is filed like a document.

### Regular vs direct

| Kind            | Listed in This Space? | Access                                                                                               | Notifications                              |
| --------------- | --------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Regular**     | Yes                   | Space ACL (v1). Multiple regular conversations per nested space are allowed (channel-style density). | Channel-style — non-intrusive.             |
| **Direct (DM)** | **Never**             | Fixed **peer set** (`conversation_peer`) ∩ workspace membership — not joinable “leave DM” membership. | DM-style — Slack-like identity and alerts. |

DMs are identified by peers, not by users joining/leaving the conversation. See [CONVERSATIONS.md](./CONVERSATIONS.md).

### DMs are global within a root space

A **root space** is a Space with no parent. A **workspace** (tenant / DM boundary, same as `root_space_id` on the tree) is a **private** root space. Within one workspace:

- At most **one** DM conversation per distinct **peer** set, regardless of which nested space the user was in when they opened it.
- **Dedupe key:** `(root_space_id, sort(peer_user_ids))`.
- **Listing:** flat **Direct messages** nav for the current root space — not nested under folders, not shown in This Space. Per-user **sidebar hide** does not change peers.
- **Peers** must be members of that **root space** (v1: any workspace member).
- **`space_id` on a DM** is optional **context only** (where the DM was started). It does **not** affect dedupe, listing, or access.
- Leaving the **workspace** loses DM access; users do not “leave” the DM peer set.

Users in multiple **workspaces** (private roots) get **separate DM inboxes** per workspace (same as multiple Slack workspaces). Public Home folders have no DM inbox until promoted to private.

### Messaging (phased)

v1 ships conversation **shell + UI** (title, route, create/rename/delete). Messaging domain: **[CONVERSATIONS.md](./CONVERSATIONS.md)**. UI: [ui-surfaces/conversation.md](./ui-surfaces/conversation.md).

---

## Meeting rooms (artifact kind) and meetings

Unlike Epicstory (live calls glued to a **channel** / “meeting channel” type) and epicstory2’s always-on Meeting channel, denser separates **place** from **occurrence**:

| Noun | What it is |
| --- | --- |
| **Meeting room** | **Artifact** (`kind = meeting_room`). Durable place filed in a space (This Space / tabs like other artifacts). |
| **Meeting** | One **instance** (scheduled / live / ended) in that room — history log, not an artifact. |
| **Meeting attendee** | Who joined a given Meeting (media flags, times). |

Many meetings accumulate under one room. **Conversation** stays messaging-only — it does not host the SFU room. Media target: **SFU** (not PeerJS mesh). Full domain (decisions, commands/queries, phasing): **[MEETINGS.md](./MEETINGS.md)**.

Phased — **not** part of the conversation messaging cut. Create-menu entry deferred until filing/ACL feels right (same as other later kinds).

---

## v1 product surface

### Create menu

**Space**, **Document**, and **Conversation** (regular, in the current space). Planning presets (**New project**, **New Scrum project**, **New folder**) are specified in [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md); they still create a Space.

Defer from create menu until filing/ACL feels right: Event, Map, Whiteboard, **Meeting room**, Workflow as a custom editor, and other **artifact kinds**. **Sprint** is a child **space**, not a kind. **Direct (DM) conversations** are created from the **Direct messages** affordance, not the generic create menu in space context.

### Document

Artifact shell + **title** + **rich-text body**.

Defer: custom properties, board/calendar enablement, relationships, comments-as-capability, issue workflows. Property-based view enablement remains a **later Document feature**, not the foundation of the type system.

### Navigation (shell)

- **Personal home** — public roots the user created, private roots they belong to, and root artifacts they own.
- **Home sidebar section** — shown on Personal home, on **public** root folders (and their content), and on root artifacts. Hidden inside a **private** root workspace tree.
- **In {space}** — flat sidebar under the active space: child spaces, then artifacts (documents + regular conversations only; meeting rooms when that kind ships).
- **Direct messages** — DM conversations for the **current private root** (workspace) where the user is a member. Not listed for public Home folders. **1:1 DM rows** show a **green presence dot** when the other peer has **workspace presence**. **Group DM rows** do not.
- **Main column** — space **tab bar** + active tab content (This Space, space views, pin, working tab).
- **Space members** (roster / member UI) — each member shows avatar + name; a **green presence dot** when that user has **workspace presence**.

### First-run feel

Blank personal home with light base UI and a create affordance — not an opinionated “what this app is” dashboard.

---

## Explicitly rejected (for this direction)

- Polymorphic base Artifact customized into Map vs Document vs Conversation via capabilities.
- Treating Conversation / Sprint / Workflow as Artifact kinds derived from one engine.
- Personal home as a normal Space row users manage like any other (conceptually it is special).
- A separate Folder type — public spaces (root or nested) are the folders.
- **Private → public** visibility (workspaces and sealed rooms stay private).
- Flattening all memberships into home.
- Direct messages on a **public** root (DMs exist only after that root is a private workspace).
- Sharing root Artifacts without a Space.
- Listing **direct** conversations in This Space / space artifact galleries.
- **View-mode pickers** on document or conversation artifact tabs (single default surface each).
- **Backlog / board as artifacts** — they are **space view** tabs (filters + layout), not filed objects.

---

## Open for later (not blocking v1)

- Full action-permission matrices per role
- Move rules edge cases (multi-step across private boundaries)
- Additional Artifact kinds
- Property-based view enablement on Documents
- Whether ownership lists on Artifacts appear for UX without affecting ACL
- **`conversation_peer`** schema, DM dedupe enforcement, sidebar hide, soft-archive
- Pin create/remove UI (working tabs are per-user; pins are shared)
- Private channels (regular conversations with explicit member lists beyond space ACL)
- Backlog / sprints / board — drafted in [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md) (not v1 shipping)

---

## Changelog

| Date       | Change                                                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-04 | Meeting rooms: SFU target, lifecycle, lessons vs epicstory/epicstory2.                                                                                    |
| 2026-09-04 | Meeting room (artifact) vs Meeting (instance); conversation + workspace presence surfaces.                                                                |
| 2026-08-28 | Visibility is the membership gate: public roots are personal Home folders (`createdBy`); private roots are workspaces. Private → public is not a feature. |
| 2026-08-28 | Tab bar: This Space → shared pins → personal working tabs. `+` opens a child as a working tab, not a pin.                                                 |
| 2026-08-28 | Backlog & sprints: child spaces + space views; see [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md).                                                    |
| 2026-08-29 | Backlog, board, and sprinting independent; project presets.                                                                                               |
