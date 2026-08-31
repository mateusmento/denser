# Board

**Status:** Draft
**Kind:** Space view (workflow)
**Density:** Dense ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))
**Feature spec:** [FEATURE-SPECS.md — Workflow](../FEATURE-SPECS.md#workflow)
**Product model:** [WORKFLOW.md](../WORKFLOW.md), [BACKLOG-AND-SPRINTS.md](../BACKLOG-AND-SPRINTS.md)
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)

---

## Intent

Columns are **workflow stages**. Cards are documents that have a stage. Dragging a card changes **stage** when the transition is allowed — not which space the document lives in. Location changes happen on the [Backlog](./backlog.md) view.

Does **not** require sprinting. Kanban: this space’s staged documents. Scrum: when sprinting is on, cards are the **active** sprint’s documents.

---

## Layout / sectioning

```text
┌─ Board ───────────────────────────────────────────────┐
│ Column (stage) · Column · Column                      │
│ Cards = documents in scope that have a stage          │
└───────────────────────────────────────────────────────┘
```

| Sprinting         | Cards                                |
| ----------------- | ------------------------------------ |
| Off               | Documents in this space with a stage |
| On, active exists | Documents in the active sprint space |
| On, no active     | Empty until Start                    |

---

## Features

| Feature          | Notes                                                 |
| ---------------- | ----------------------------------------------------- |
| Columns          | Workflow stages for this space, in order              |
| Drag card        | Allowed transition → new stage; illegal drop rejected |
| Open document    | Working tab on this host                              |
| No location drag | Do not move between sprints/parent here               |

---

## Data (UI-facing)

| UI need     | Source                                  |
| ----------- | --------------------------------------- |
| Columns     | This space’s workflow                   |
| Cards       | Staged documents in scope (table above) |
| Card chrome | Title; stage; later assignee / priority |

Documents without a stage do not appear on the board. They can still appear on Backlog.

---

## Changelog

| Date       | Change                                                                               |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-08-28 | Draft: board of active sprint; drag = status.                                        |
| 2026-08-29 | Board requires workflow, not sprints. Active-sprint scope only when sprinting is on. |
