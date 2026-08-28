# Denser

Workspace for nested spaces and typed artifacts. This glossary is the ubiquitous language — not a spec.

## Language

**Space**:
A membership, visibility, and ownership boundary that can contain child spaces and artifacts. Not an artifact.
_Avoid_: Folder (as a type), project, workspace (unless it is a private root)

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
