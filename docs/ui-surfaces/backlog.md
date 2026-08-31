# Backlog

**Status:** Draft  
**Kind:** Space view (planning)  
**Density:** Dense ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))  
**Feature spec:** [FEATURE-SPECS.md — Backlog & sprints](../FEATURE-SPECS.md#backlog--sprints)  
**Product model:** [BACKLOG-AND-SPRINTS.md](../BACKLOG-AND-SPRINTS.md)  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)

---

## Intent

A ranked list of **this space’s documents**. Does not require sprints or a workflow. If sprinting is on, the same view adds **Active** and **Upcoming** sections so planning is drag between locations. This is a view, not an artifact.

---

## Layout / sectioning

Without sprinting:

```text
┌─ Backlog ─────────────────────────────────────────────┐
│ Documents in this space                               │
└───────────────────────────────────────────────────────┘
```

With sprinting:

```text
┌─ Backlog ─────────────────────────────────────────────┐
│ Active sprint (omitted if none)                       │
│ Upcoming sprint                                       │
│ Documents still on this space                         │
└───────────────────────────────────────────────────────┘
```

Upcoming is always above the unscheduled list. Rank is per section. Past sprints are not sections.

---

## Features

| Feature          | Notes                                                                               |
| ---------------- | ----------------------------------------------------------------------------------- |
| List             | Documents whose parent is this space (plus sprint children when sprinting is on)    |
| Sprint sections  | Only if sprinting is on                                                             |
| Drag             | Between sections: **move** `space_id`; drop position sets rank. One list: rank only |
| Create           | Unscheduled list → this space; sprint section → that sprint space                   |
| Start / complete | Shown when sprinting is on and `canManage`                                          |
| Open document    | Working tab on this host                                                            |

---

## Data (UI-facing)

| UI need         | Source                                  |
| --------------- | --------------------------------------- |
| Rows            | Documents with `space_id` = this space  |
| Sprint sections | Clock + documents in those child spaces |
| Order           | Rank within each space                  |

---

## Interactions

- Drag between sprint sections → move, not copy.
- Click row → document working tab; Backlog stays a view tab.

---

## Changelog

| Date       | Change                                                |
| ---------- | ----------------------------------------------------- |
| 2026-08-28 | Draft: three sections, drag = move.                   |
| 2026-08-29 | Sprints optional; sections only when sprinting is on. |
