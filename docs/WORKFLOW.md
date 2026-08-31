# Workflow

**Status:** Draft (conception)  
**Source:** Epicstory `03-workflow-engine.md` / `04-transition-rules.md`, mapped in [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md)  
**Surfaces:** [board.md](./ui-surfaces/board.md)  
**Feature spec:** [FEATURE-SPECS.md — Workflow](./FEATURE-SPECS.md#workflow)

A **workflow** is a reusable, **space-scoped** model: ordered stages, a **kind** per stage, and **allowed sources** per stage. Document types reference a workflow. The Board is that machine visualized.

Not an artifact kind. Not team-scoped.

---

## Objects

### Workflow

| Field   | Notes                      |
| ------- | -------------------------- |
| id      | uuid                       |
| name    | e.g. Issue tracking        |
| spaceId | Project space that owns it |
| stages  | Ordered list               |

### Stage

| Field                 | Notes                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| id                    | uuid (stable; rename does not change id)                                                           |
| name                  | Display, e.g. Todo, In Review, Done                                                                |
| kind                  | Stage kind                                                                                         |
| description           | Optional                                                                                           |
| allowedSourceStageIds | Which stages may transition **to** this one. Empty-or-sentinel “any” = all stages in this workflow |

Documents store **`stageId`**, not the name.

### Stage kinds

No **Backlog** kind. Unscheduled work is location, not a stage.

| Kind            | Meaning                  | System                                                                           |
| --------------- | ------------------------ | -------------------------------------------------------------------------------- |
| **Idle**        | Planned, not started     | Editable                                                                         |
| **In Progress** | Active work              | Editable                                                                         |
| **Blocked**     | Dependency-blocked       | Cannot advance until blocker is Settled (or in the active sprint — see planning) |
| **Settled**     | Completed                | Read-only body/fields except reopen; counts as progress                          |
| **Cancelled**   | Closed without finishing | Read-only; does not count as progress                                            |

---

## Defaults (presets, not constraints)

**Issue** (Kanban/Scrum default):

`Todo (idle) → In Progress → In Review (in progress) → Done (settled)`

**Spec:**

`Draft (idle) → In Review (in progress) → Approved (in progress) → Final (settled)`

Optional Blocked stage may be inserted; if present, blocked-by auto-moves into it.

New documents of a type with a workflow start at the **first idle** stage (or first stage if none is idle).

---

## Transitions

Each stage lists **allowed sources**. Default Issue: Done allowed only from In Review; every other stage allows any.

**Dead-end check** on save: every idle, in-progress, and blocked stage must have a path to at least one settled stage. Settled/cancelled may be dead ends.

### Context

| Where the document lives                                        | Rule                                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| On the **Board** (Kanban: this space; Scrum: **active** sprint) | Any-to-any, subject to allowed sources. Settled **rollback** allowed (correction). |
| **Upcoming**, **past** sprint, or unscheduled on the parent     | **Forward** only (no rollback). Settled/cancelled stay closed until **reopen**.    |

Skipping stages is allowed when the target lists the current stage as a source (e.g. Todo → In Review).

Backend rejects illegal transitions. UI greys invalid columns / omits them from the picker. Optimistic drag; toast + snap back on 4xx.

Rename stage: keep id; no document rewrite. Remove stage: move documents to fallback (first idle, or prompt). Reorder: order only.

Cannot delete a workflow still referenced by a document type — reassign types first.

---

## Blocked + dependencies

| Link               | Meaning                             |
| ------------------ | ----------------------------------- |
| A **blocked by** B | A cannot proceed until B is Settled |
| A **blocks** B     | Inverse                             |

If the workflow has a Blocked-kind stage and A is blocked by B: auto-move A to that stage. If B becomes Settled: move A back to its previous non-blocked stage (or first idle).

If there is no Blocked stage, links are informational only.

Dragging a blocked document onto a sprint section: if B is not Settled and not already in the active sprint, prompt to move B too.

---

## Reopen

Settled/Cancelled cannot be dragged onto a sprint. **Reopen** sets stage to the first idle stage. If the document still lives in a **past** sprint, reopen also **moves** it to the project space (unscheduled). Then it can be planned again.

---

## Permissions

| Action                             | Who                                         |
| ---------------------------------- | ------------------------------------------- |
| Create / edit / duplicate workflow | `canManage` on the owning space             |
| Transition / reopen                | Same as editing the document (space access) |

---

## Denser domains

**workflows** domain: CRUD, validate transition given document location (parent vs which sprint child). **documents** / **artifacts**: persist `stageId`. **spaces**: Board flag means this space’s workflow is the board’s columns.

---

## Explicitly rejected

- Backlog as a stage kind
- Team-scoped workflows
- Stage change as the way to enter a sprint
- Requiring an active sprint in order to transition (that would break Kanban)

---

## Open

- Custom workflow editor in v1 vs presets only (rules above assume both; UI can ship presets first)
- Visual transition graph (later; checklist UI is enough)

---

## Changelog

| Date       | Change                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-08-29 | Ported from Epicstory; space-scoped; no Backlog kind; Kanban + Scrum context. |
