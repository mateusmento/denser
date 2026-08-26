# Artifacts & Spaces — v1 conception

Grilled decisions for Denser’s core model. This supersedes the polymorphic “Object / evolving Document” framing in older ontology notes for product direction going forward.

---

## Core nouns

### Artifact

A **thin shell** shared by typed subsystems — the filing and listing noun, **not** a customization engine.

Shell fields (conceptual):

- identity (`id`)
- kind (`document` | `conversation` | … later kinds)
- title
- location: parent Space (`space_id`, nullable for root) + `root_space_id` for tenancy indexing when inside a Space tree
- `createdBy`
- timestamps / version as needed

**Not shared across kinds:** content engines. Document, Map, Conversation, etc. are separate feature modules. You do not turn a Document into a Map by toggling capabilities.

### Space

A **membership, visibility, and ownership boundary**. Spaces nest. A Space can contain **child Spaces** and **Artifacts** as siblings (directory + files metaphor). Spaces are **not** Artifacts.

Spaces are distinguished by **visibility** only (`public` / `private` on nested spaces; root is always private).

Folders are **deferred**; nesting Spaces covers organization for now.

### Space tabs

Every space has a **tab bar** — the single mechanism for “what am I looking at in this space?”

| Tab kind | v1 | Role |
| -------- | -- | ---- |
| **This Space** | Yes | Always present (rename from “Gallery”). Browse **child spaces** and **regular artifacts** in the current space. |
| **Artifact** | Yes | Open a **document** or **regular conversation** in-place. One fixed view per kind — no view-mode picker on document or conversation tabs. |
| **Pinned space** | Optional | Open a child space as its own tab. |
| **Space view** | Later | **Backlog** / **board** — filters and layout over the space’s content, not an artifact or child space. |

The **`+`** on the tab bar adds tabs (new conversation, pin document, pin child space; backlog/board when views land). A conversation opened from a tab is the same artifact as one listed in This Space — tabs are navigation, not a second object model.

### Personal home

**Not a Space.** The blank landing for a logged-in user: all **root** Spaces and **root** Artifacts they own (and root Spaces they belong to). Nested Spaces/Artifacts stay under their parents so home does not become a dump.

---

## Location & tenancy

| Item            | Parent                 | Home?                              |
| --------------- | ---------------------- | ---------------------------------- |
| Root Space      | none                   | Yes, if user owns or is a member   |
| Nested Space    | another Space          | No — only under parent             |
| Root Artifact   | none (`space_id` null) | Yes, if user owns it               |
| Nested Artifact | a Space                | No — only when browsing that Space |

Persist **`root_space_id`** alongside **`space_id`** on rows that live in a Space tree (tenant index). Root Artifacts have no Space parent; do not invent a fake Space row for personal home unless storage forces it later.

---

## Visibility

| Space      | Visibility             | Membership                                     | Behavior                                                     |
| ---------- | ---------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| **Root**   | **Always private**     | Explicit                                       | Never public; lives at personal-home root                    |
| **Nested** | **Public by default**  | Inherited from parent ∪ optional explicit adds | Acts like a folder                                           |
| **Nested** | **Private** (optional) | Explicit list only                             | Sealed room; no casual move of Artifacts across its boundary |

When flipping nested **public → private**, **copy current members** into an explicit list so nobody is locked out.

---

## Sharing & ACL

- **Root Artifacts:** owner-only. No member lists on free-floating files. To share, put the Artifact in a Space and invite.
- **In-Space Artifacts:** access from **Space roles / actions** only. Always persist **`createdBy`**. No separate Artifact-level ACL in v1 (applies to documents and **regular** conversations).
- **Direct conversations:** access from **`conversation_member`** only — not space gallery listing, not inherited from nested `space_id` context.
- **Space ownership:** multi-owner supported where roles allow; persist **`createdBy`** and ownership/membership separately.

### Roles

| Role       | Where            | Notes                                                                                                                                                                                                                                                                                                                              |
| ---------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**  | Root Spaces only | Can do everything Admin can; unique root powers (e.g. delete root Space). **Break-glass** over the whole tree under that root: control/recovery (membership, visibility, delete nested Spaces) — **not** ambient Member read of every private child. Private nested content still needs membership or a deliberate Owner override. |
| **Admin**  | Root and nested  | Day-to-day control; on nested Spaces may delete that Space. Cannot delete a **root** Space.                                                                                                                                                                                                                                        |
| **Member** | Root and nested  | Participate per action grants (create content, etc., as configured).                                                                                                                                                                                                                                                               |

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

| Kind | Listed in This Space? | Access | Notifications |
| ---- | --------------------- | ------ | ------------- |
| **Regular** | Yes | Space ACL (v1). Multiple regular conversations per nested space are allowed (channel-style density). | Channel-style — non-intrusive. |
| **Direct (DM)** | **Never** | Explicit **`conversation_member`** rows only. Supports multi-peer DMs, not only 1:1. | DM-style — Slack-like identity and alerts. |

**Direct membership applies only to DM conversations**, not to spaces. Space membership remains the boundary for team chat; DM membership is per conversation.

### DMs are global within a root space

A **root space** is the workspace / tenant boundary (same as `root_space_id` on the space tree). Within one root space:

- At most **one** DM conversation per distinct member set, regardless of which nested space the user was in when they opened it.
- **Dedupe key:** `(root_space_id, sort(member_user_ids))`.
- **Listing:** flat **Direct messages** nav for the current root space — not nested under folders, not shown in This Space.
- **Participants** must be members of that **root space** (v1: any member of the workspace; optional later tightening to “people in this nested space”).
- **`space_id` on a DM** is optional **context only** (where the DM was started). It does **not** affect dedupe, listing, or access.

Users in multiple root spaces get **separate DM inboxes** per workspace (same as multiple Slack workspaces).

### Messaging (phased)

v1 ships conversation **shell + UI** (title, route, create/rename/delete). Message persistence, timeline, and notification delivery follow the [Conversation feature spec](./FEATURE-SPECS.md#conversation).

---

## v1 product surface

### Create menu

**Space**, **Document**, and **Conversation** (regular, in the current space).

Defer: Event, Map, Whiteboard, Meeting, Workflow, Sprint, and other kinds until filing/ACL feels right. **Direct (DM) conversations** are created from the **Direct messages** affordance, not the generic create menu in space context.

### Document

Artifact shell + **title** + **rich-text body**.

Defer: custom properties, board/calendar enablement, relationships, comments-as-capability, issue workflows. Property-based view enablement remains a **later Document feature**, not the foundation of the type system.

### Navigation (shell)

- **Personal home** — root spaces and root artifacts the user can access.
- **In {space}** — flat sidebar under the active space: child spaces, then artifacts (documents + regular conversations only).
- **Direct messages** — DM conversations for the **current root space** where the user is a member.
- **Main column** — space **tab bar** + active tab content (This Space, artifact surface, or later space views).

### First-run feel

Blank personal home with light base UI and a create affordance — not an opinionated “what this app is” dashboard.

---

## Explicitly rejected (for this direction)

- Polymorphic base Artifact customized into Map vs Document vs Conversation via capabilities.
- Treating Conversation / Sprint / Workflow as Artifact kinds derived from one engine.
- Personal home as a normal Space row users manage like any other (conceptually it is special).
- Flattening all memberships into home.
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
- **`conversation_member`** schema, DM dedupe enforcement, and DM-only API paths
- Space tab persistence (per-user vs shared)
- Private channels (regular conversations with explicit member lists beyond space ACL)
- Backlog / board space-view tabs and their filter model
