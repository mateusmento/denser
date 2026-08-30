# Planning domain (Epicstory → Denser)

**Status:** Draft  
**Related:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md), [BACKLOG-AND-SPRINTS.md](./BACKLOG-AND-SPRINTS.md), [WORKFLOW.md](./WORKFLOW.md), [DOCUMENT-TYPES.md](./DOCUMENT-TYPES.md)

Epicstory decisions in `epicstory2/docs/decisions/domain/` are the source of workflows, types, transitions, and sprint rhythm. Denser already has **Space**, **Artifact**, and **Document** (body). This file is the map. Prefer Denser filing where the two conflict.

---

## Noun map

| Epicstory | Denser |
| --------- | ------ |
| Team | **Space** that owns workflows, document types, and optional sprinting (a project-like space). Not a Team type. |
| Workspace | **Workspace** — private root space (`root_space_id`) |
| Folder | **Public nested space** |
| Project | **Preset / intent** on a space (Backlog and/or Board). Not a type. |
| Channel | **Conversation** artifact (regular). DMs are **direct** conversations on the workspace. |
| Sprint (row + document IDs) | **Child space** with role upcoming / active / past. Documents **live in** that space. |
| Document | **Artifact** `kind = document` + document body (TipTap). Fields come from a **document type**. |
| Document type (team-scoped) | Document type **space-scoped** (same space as the Board) |
| Workflow (team-scoped) | Workflow **space-scoped** (same space as the Board) |
| Backlog **stage kind** | **Dropped.** Unscheduled work is documents whose `space_id` is the project space. |
| Prefix / `PROJ-42` | Optional **space key** + sequence on the project space (not a Project entity) |
| Epic | Later. Not a space. |

---

## What we keep from Epicstory

- Workflows as first-class, reusable models with ordered **stages** and **kinds**
- Per-stage **allowed sources** for transitions
- Default Issue / Spec workflows (minus the Backlog stage)
- Document types as templates; field composition; in-place type conversion
- Builtin Issue / Spec / Doc; clone or customize
- One active + one upcoming sprint; manual **start**; `Sprint {n}` names; duration; goal
- Blocked-by / blocks + auto-move to a **Blocked** kind when the workflow has that stage
- Settled / Cancelled as closed; reopen is an explicit action
- Dead-end detection when saving transition graphs
- Optimistic board drag; backend validates

---

## What Denser already decided (overrides Epicstory)

| Epicstory | Denser |
| --------- | ------ |
| Backlog is a workflow stage; board hides it | Backlog is a **view** + **location** (`space_id`) |
| Stage change into a forward stage **enters** the active sprint | Planning is **drag on the Backlog view** (move). Board drag changes **stage** only. |
| Complete sprint **auto** on end date; leftovers reset to Backlog stage and auto-carry | **Manual** complete. Leftovers **stay** in the past sprint unless moved in that step. Period is still stored. |
| Transitions only fully flexible **in** an active sprint | **Kanban** (no sprinting): Board is this space; full flexibility subject to allowed sources. **Scrum:** Board is the active sprint. |
| Team Lead manages workflows | **`canManage`** on the space that owns them ([tenancy access](../packages/api/src/domains/tenancy/access.ts)) |
| Archive + 30-day auto-delete | Keep today’s **delete** on artifacts until a later archive spec |
| Reports, burndown, velocity, epics | Later |

---

## Denser API domains

Existing (`packages/api/src/domains`):

| Domain | Owns |
| ------ | ---- |
| **tenancy** | `canAccessSpace`, `canManageSpace`, artifact access |
| **spaces** | Space rows, membership, create/patch, children, visibility |
| **artifacts** | Shell: id, kind, title, `spaceId`, `rootSpaceId`, version |
| **documents** | TipTap **body** on a document artifact |
| **conversations** | Regular vs direct; DMs on the private root |
| **home** | Root spaces and root artifacts the user can see |

Add (same package, new folders):

| Domain | Owns |
| ------ | ---- |
| **workflows** | Workflows, stages, kinds, allowed sources; validate transition |
| **documentTypes** | Types and field definitions; assign type; convert type |
| **spaces** (extend) | View flags (Backlog, Board), sprinting flag, clock (`activeSprintId`, `upcomingSprintId`), space **key** for identifiers, sprint **role** on child spaces |

Sprint is not a fourth filing noun. The clock and roles live on **spaces**. Documents never store a sprint id — location is `artifact.space_id`.

---

## Ownership

Workflows and document types belong to the **project space** (the space with Backlog and/or Board). Sprint children **do not** have their own workflows or types. A document in an active sprint still uses the parent’s type and workflow.

A workspace (private root) may contain many such project spaces, each with its own types and workflows.
