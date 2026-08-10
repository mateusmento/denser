# Artifacts & Spaces — v1 conception

Grilled decisions for Denser’s core model. This supersedes the polymorphic “Object / evolving Document” framing in older ontology notes for product direction going forward.

---

## Core nouns

### Artifact

A **thin shell** shared by typed subsystems — the filing and listing noun, **not** a customization engine.

Shell fields (conceptual):

- identity (`id`)
- kind (`document` | … later kinds)
- title
- location: parent Space (`space_id`, nullable for root) + `root_space_id` for tenancy indexing when inside a Space tree
- `createdBy`
- timestamps / version as needed

**Not shared across kinds:** content engines. Document, Map, Conversation, etc. are separate feature modules. You do not turn a Document into a Map by toggling capabilities.

### Space

A **membership, visibility, and ownership boundary**. Spaces nest. A Space can contain **child Spaces** and **Artifacts** as siblings (directory + files metaphor). Spaces are **not** Artifacts.

Folders are **deferred**; nesting Spaces covers organization for now.

### Personal home

**Not a Space.** The blank landing for a logged-in user: all **root** Spaces and **root** Artifacts they own (and root Spaces they belong to). Nested Spaces/Artifacts stay under their parents so home does not become a dump.

---

## Location & tenancy

| Item | Parent | Home? |
| --- | --- | --- |
| Root Space | none | Yes, if user owns or is a member |
| Nested Space | another Space | No — only under parent |
| Root Artifact | none (`space_id` null) | Yes, if user owns it |
| Nested Artifact | a Space | No — only when browsing that Space |

Persist **`root_space_id`** alongside **`space_id`** on rows that live in a Space tree (tenant index). Root Artifacts have no Space parent; do not invent a fake Space row for personal home unless storage forces it later.

---

## Visibility

| Space | Visibility | Membership | Behavior |
| --- | --- | --- | --- |
| **Root** | **Always private** | Explicit | Never public; lives at personal-home root |
| **Nested** | **Public by default** | Inherited from parent ∪ optional explicit adds | Acts like a folder |
| **Nested** | **Private** (optional) | Explicit list only | Sealed room; no casual move of Artifacts across its boundary |

When flipping nested **public → private**, **copy current members** into an explicit list so nobody is locked out.

---

## Sharing & ACL

- **Root Artifacts:** owner-only. No member lists on free-floating files. To share, put the Artifact in a Space and invite.
- **In-Space Artifacts:** access from **Space roles / actions** only. Always persist **`createdBy`**. No separate Artifact-level ACL in v1.
- **Space ownership:** multi-owner supported where roles allow; persist **`createdBy`** and ownership/membership separately.

### Roles

| Role | Where | Notes |
| --- | --- | --- |
| **Owner** | Root Spaces only | Can do everything Admin can; unique root powers (e.g. delete root Space). **Break-glass** over the whole tree under that root: control/recovery (membership, visibility, delete nested Spaces) — **not** ambient Member read of every private child. Private nested content still needs membership or a deliberate Owner override. |
| **Admin** | Root and nested | Day-to-day control; on nested Spaces may delete that Space. Cannot delete a **root** Space. |
| **Member** | Root and nested | Participate per action grants (create content, etc., as configured). |

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

## v1 product surface

### Create menu

**Space** and **Document** only.

Defer: Event, Map, Whiteboard, Conversation, Meeting, Workflow, Sprint, and other kinds until filing/ACL feels right.

### Document

Artifact shell + **title** + **rich-text body**.  

Defer: custom properties, board/calendar enablement, relationships, comments-as-capability, issue workflows. Property-based view enablement remains a **later Document feature**, not the foundation of the type system.

### First-run feel

Blank personal home with light base UI and a create affordance — not an opinionated “what this app is” dashboard.

---

## Explicitly rejected (for this direction)

- Polymorphic base Artifact customized into Map vs Document vs Conversation via capabilities.
- Treating Conversation / Sprint / Workflow as Artifact kinds derived from one engine.
- Personal home as a normal Space row users manage like any other (conceptually it is special).
- Flattening all memberships into home.
- Sharing root Artifacts without a Space.

---

## Open for later (not blocking v1)

- Full action-permission matrices per role
- Move rules edge cases (multi-step across private boundaries)
- Additional Artifact kinds
- Property-based view enablement on Documents
- Whether ownership lists on Artifacts appear for UX without affecting ACL
