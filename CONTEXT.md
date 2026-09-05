# Denser

Workspace for nested spaces and typed artifacts. This glossary is the ubiquitous language — not a spec.

## Language

**Space**:
A membership, visibility, and ownership boundary that can contain child spaces and artifacts. Not an artifact. Organizational asset + optional membership.
_Avoid_: Folder (as a type), treating Project / Channel / Sprint as extra types

**Root space**:
A space with no parent. May be public (personal folder) or private (workspace).

**Workspace**:
A **private** root space — the tenant boundary for membership, invites, and direct messages (`root_space_id`).
_Avoid_: Calling every root a workspace; public Home folders are not workspaces

**Personal home**:
The logged-in landing that is **not** a space: public roots the user created, private roots they belong to, and root artifacts they own.
_Avoid_: Personal space, treating Home as a Space row

**Public**:
No membership gate. Nested: inherit parent access. Root: `createdBy` only.
_Avoid_: Internet-public, world-visible

**Private**:
Membership is the access gate. Nested: parent access and an explicit member list. Root: workspace members.
_Avoid_: Making a private space public (not a feature)

**Root artifact**:
An artifact with no space parent (`space_id` null), owner-only, listed on Personal home.

**Working tab**:
A personal tab on a space's bar for this user only. Closable. Opening a child from `+` is a working tab.
_Avoid_: Pin, pinned tab

**Pin**:
A shared tab on a space's bar, visible to members who can read the target. Only canManage can add or remove. Not closable. Direct conversations cannot be pins.
_Avoid_: Working tab, calling a personal open a pin

**Project**:
A space set up for tracked work (Backlog and/or Board). A create preset, not a type.
_Avoid_: Project as a separate entity

**Sprinting**:
Opt-in clock on a space: one upcoming, at most one active, rest past. Sprint children are spaces.
_Avoid_: Requiring sprinting for Backlog or Board

**Sprint**:
A child space with role upcoming, active, or past. Timeboxed. Documents in it live there.
_Avoid_: Sprint as an artifact kind; Backlog as a workflow stage

**Backlog**:
A space view over this space's documents. When sprinting is on, Active and Upcoming sections appear above the rest.
_Avoid_: Backlog as an artifact, a space, or a workflow stage

**Board**:
A space view of documents that have a workflow stage. Columns are stages. Does not require sprinting.
_Avoid_: Board as an artifact

**Workflow**:
A space-scoped sequence of stages with kinds and allowed transitions. Referenced by document types.
_Avoid_: Team-scoped workflow; Backlog as a stage kind

**Stage**:
A named step in a workflow. Kind is Idle, In Progress, Blocked, Settled, or Cancelled.
_Avoid_: Backlog kind

**Document type**:
A space-scoped template of extra fields on a document artifact. Issue, Spec, and Doc are builtins.
_Avoid_: Issue as an artifact kind

**Conversation**:
An artifact kind for persistent messaging (`regular` in a space, or `direct` DM). Not a meeting place.
_Avoid_: Channel as a separate type; embedding live calls inside the conversation artifact

**Meeting room**:
An artifact kind for a durable place where meetings happen. Filed like other artifacts.
_Avoid_: Meeting as the artifact; channel-type meeting rooms; embedding live calls in Conversation

**Meeting**:
One occurrence inside a meeting room — scheduled, live, or ended session log — not the room itself.
_Avoid_: Calling the room a meeting; treating meetings as messages; always-on sessions with no end

**Meeting attendee**:
A user's join on a specific Meeting (live-session presence).
_Avoid_: Equating with workspace presence or conversation viewers

**Attachment**:
A workspace-pooled blob (file metadata + storage key). Parents reference it; they do not own it exclusively.
_Avoid_: Message-owned file; exclusive message_id on the blob

**Attachment reference**:
A join from an Attachment to a parent anchor (draft, scheduled job, message, …).
_Avoid_: Storing attachment ids only in JSON payload as the source of truth

**Message draft**:
Server-backed in-progress composer state for one author in one conversation (main or thread), including TipTap body and attachment references before send or schedule.
_Avoid_: Equating with Message; epicstory-style dual-write as denser v1 SoT; local-only forever when files are staged

**Scheduled job**:
Durable due work in the workspace scheduler (type + payload + due/recurrence/lock).
_Avoid_: One queue table per feature; calling the product “ScheduledMessage” a separate entity table

**Scheduled message**:
A scheduled job of type scheduled_message that will post into a Conversation.
_Avoid_: Equating with Meeting schedule; stuffing attachment SoT into job JSON

**Conversation peer**:
A user in the fixed peer set of a direct conversation (identity + access). Not a joinable membership.
_Avoid_: conversation member; leave DM

**Conversation presence**:
Who is currently viewing a given conversation.
_Avoid_: Equating with workspace presence

**Workspace presence**:
Who is currently online within a private root space (workspace).
_Avoid_: Equating with conversation presence; treating presence as membership
