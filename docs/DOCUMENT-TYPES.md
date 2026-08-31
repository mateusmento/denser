# Document types

**Status:** Draft (conception)  
**Source:** Epicstory `02-document-types-as-templates.md`, `01-unified-document-model.md`, `02-document-lifecycle.md`, mapped in [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md)  
**Filing:** [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md) — still one Artifact kind `document`  
**Feature spec:** [FEATURE-SPECS.md — Document types](./FEATURE-SPECS.md#document-types)

A **document type** is a **space-scoped** template: which fields a document has. Behavior comes from field composition (especially **Workflow**), not from extra artifact kinds. Builtin types: Issue, Spec, Doc.

The artifact is still `kind = document`. The type is a schema on that shell + body.

---

## Objects

### Document type

| Field        | Notes                      |
| ------------ | -------------------------- |
| id           | uuid                       |
| name         | Issue, Spec, Bug, …        |
| description  | Optional                   |
| spaceId      | Project space that owns it |
| icon / color | Optional chrome            |
| builtin      | Cannot delete if true      |
| fields       | Ordered field definitions  |

### Field definition

| Field        | Notes                              |
| ------------ | ---------------------------------- |
| key          | `title`, `assignee`, `priority`, … |
| label        | Display                            |
| fieldType    | See below                          |
| required     |                                    |
| defaultValue | Optional                           |
| options      | Selects                            |
| order        |                                    |

**Title** and **body** are always on the artifact / document row. They are not optional field types. Types describe **extra** fields.

### Field types

| Type                                                | Denser mapping                                                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Workflow**                                        | Document participates in the space’s (or this field’s) workflow; has `stageId`. Trackable on Board; can be planned into sprints.        |
| **Prefix**                                          | Human id `{spaceKey}-{n}` from the **project space** key, even if the document currently lives in a sprint child. Not a Project entity. |
| **Related to**                                      | Link to another document (rework, relation). Later with dependencies.                                                                   |
| Text, long text, number, date, select, multi-select | Extra fields JSON on the document                                                                                                       |
| User                                                | User id                                                                                                                                 |
| Labels                                              | Space-scoped labels (later if labels are not in v1)                                                                                     |

Without a Workflow field, the document appears on Backlog (it is still a document in the space) but **not** on the Board.

---

## Builtins

| Type      | Extra fields                                                                 | Trackable |
| --------- | ---------------------------------------------------------------------------- | --------- |
| **Issue** | Workflow, Prefix, Assignee, Labels, Priority, Due date, Estimate, Related to | Yes       |
| **Spec**  | Workflow, Assignee, Labels                                                   | Yes       |
| **Doc**   | Labels                                                                       | No        |

Customize builtins (add/remove extra fields); do not delete them. Clone to make a custom type. Custom types with Workflow (+ optional Prefix) behave like Issue.

---

## Document row (beyond today’s body)

Today: artifact shell + TipTap body.

Add:

| Field          | Notes                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| documentTypeId | Required once types exist; default **Doc** in a folder, **Issue** on a Backlog |
| stageId        | Null if the type has no Workflow                                               |
| fields         | JSON values for extra keys                                                     |
| rank           | Integer, ordered among siblings in the same `space_id`                         |
| identifier     | Optional `KEY-n` if the type has Prefix                                        |

`space_id` / `root_space_id` stay on the **artifact** (filing). Version stays on the artifact (409).

---

## Lifecycle

**Create:** from This Space, Backlog, or Board. Title required. Type pre-selected by context (Backlog → Issue, This Space / folder → Doc); user can change. Workflow types start at first idle stage. Prefix assigned from the project space if the type has Prefix.

**Convert type (in place):** keep artifact id, body, history. Keep extra fields whose keys exist on the target; drop the rest; prompt for new required fields. Workflow: match stage **name**; else prompt. Prefix: Issue → Doc drops identifier; Doc → Issue assigns from this project space.

**Duplicate:** full copy, new id, no identifier until assigned.

**Delete:** keep current artifact delete (Epicstory archive+30d is later).

**Move:** change `space_id` (This Space, Backlog sections). Identifier stays bound to the **project space**, not the sprint child.

---

## Permissions

| Action                           | Who                                           |
| -------------------------------- | --------------------------------------------- |
| Define / clone / edit types      | `canManage` on the owning space               |
| Create / convert / edit document | Space access (same as today’s document patch) |

---

## Denser domains

**documentTypes** domain: CRUD types. **documents** domain: type, stage, extra fields, rank, identifier — body stays here. **artifacts** domain: still the shell and `space_id`. **workflows** domain: stage validation on convert and on Board drag.

---

## Explicitly rejected

- Issue / Spec as artifact kinds
- Team-scoped types
- Prefix bound to a Project entity
- Derivation (new document) instead of in-place convert

---

## Open

- Labels as a real catalog vs free tags
- Related-to / blocked-by shipping with types vs with workflow only
- Archive vs delete

---

## Changelog

| Date       | Change                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| 2026-08-29 | Ported from Epicstory; space-scoped; Prefix → space key; filing stays Artifact. |
