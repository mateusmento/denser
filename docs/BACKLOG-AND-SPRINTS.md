# Backlog, board, and sprints

**Status:** Draft (conception)  
**Related:** [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md) (Epicstory map), [WORKFLOW.md](./WORKFLOW.md), [DOCUMENT-TYPES.md](./DOCUMENT-TYPES.md), [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md), [FEATURE-SPECS.md](./FEATURE-SPECS.md#backlog--sprints), [ui-surfaces/backlog.md](./ui-surfaces/backlog.md), [ui-surfaces/board.md](./ui-surfaces/board.md)

Space is the noun: an organizational asset with optional membership. Workspace, folder, project, channel, group, and sprint are **intents** (how a space is set up and talked about), not extra types.

Denser prioritizes **intent over primitives**. Users should not have to assemble views, workflows, and sprinting by hand to get a useful project. Named **presets** do that assembly. The engine stays one Space model.

Backlog, board, and sprinting are **independent**. None requires the others. Views that are on **pick up** sprinting when it is enabled.

---

## Three capabilities

| Capability | Needs | Does not need | What it shows |
| ---------- | ----- | ------------- | ------------- |
| **Backlog view** | Documents in this space | Sprints, workflow | This space’s documents. If sprinting is on: Active and Upcoming sections appear above the rest. |
| **Board view** | A **workflow** and a **stage** on documents | Sprints | Columns = workflow stages. Drag follows **transition rules**. If sprinting is on: scoped to the **active** sprint. If not: this space’s staged documents (Kanban). |
| **Sprinting** | Opt-in clock; sprint **child spaces** | Backlog or Board to exist first | One upcoming, at most one active; rest past. Enable creates the first upcoming. |

Only **documents** appear on Backlog and Board. Conversations and DMs do not.

Documents in **non-sprint** child spaces are not this parent’s backlog or board — they belong to that child’s views.

---

## Intent and presets

The create command names the job. Storage is still a space (flags + a default workflow when needed).

| Command | What it sets up |
| ------- | ---------------- |
| **New folder** | Space. This Space only. No planning views. |
| **New project** / **New Kanban project** | Space + Backlog + Board + a default workflow. No sprint clock. |
| **New Scrum project** | That, plus **sprinting** on (first upcoming sprint space). |

Empty state and tabs teach the rest: a Scrum project shows Backlog and Board; sprint sections show up on Backlog because sprinting is on. Settings may show `Space · Scrum preset` for people who care.

Users can still enable Backlog, Board, or sprinting later on any space (`canManage`). Presets are the default path, not the only path.

---

## Nouns

| Noun | What it is |
| ---- | ---------- |
| **Space** | Organizational asset + optional membership. The only filing type here. |
| **Project** | Intent: a space set up for tracked work (Backlog and/or Board). Not a type. |
| **Sprint** | Child space of a space with sprinting on, role **upcoming** / **active** / **past**. Timeboxed. Documents in it **live there**. |
| **Backlog (view)** | Space view over this space’s documents. Sprint sections only when sprinting is on. |
| **Board (view)** | Space view: columns are workflow stages. Requires workflow + stage on documents. |
| **Workflow** | Ordered **stages** plus **transition rules**. Lives on the space that has Board (or ships with a project preset). |

**In a sprint** means `space_id` is that sprint child. Drag on Backlog between sections **moves** the document.

Sprint children stay **public nested** (inherit parent access).

---

## Backlog view

Without sprinting: one ranked list of documents whose parent is this space.

With sprinting, same view, extra sections, top to bottom:

1. **Active** (omitted if none)
2. **Upcoming**
3. **This space** — documents still on the parent (not in a sprint child)

Upcoming stays above the unscheduled list. Rank is per section. Drop into another section **moves** `space_id`.

Create in the unscheduled list → parent. Create in a sprint section → that sprint space.

Past sprints are not sections. They appear as children in This Space.

---

## Board view

Columns are the space’s workflow stages, in order. Cards are documents that have a stage. Drag to a column is a **transition**; illegal targets are rejected. Location does not change here — that is Backlog.

| Sprinting | Cards |
| --------- | ----- |
| Off | Documents in this space that have a stage |
| On, active exists | Documents in the **active** sprint space |
| On, no active | Empty until Start |

The Board is specified in [WORKFLOW.md](./WORKFLOW.md). Trackable documents (type has a Workflow field) are cards; others stay on Backlog only.

---

## Sprinting (clock)

At most **one active** and **one upcoming**. Enable is explicit (`canManage`). The system does not create sprints unless the user enabled sprinting or **Start** (which creates the next upcoming).

| Action | Result |
| ------ | ------ |
| **Enable sprints** | First **upcoming** child exists. Backlog, if on, grows sections. Board, if on, waits for an active sprint. |
| **Start** (no active) | Upcoming → active. New upcoming created. |
| **Complete** (active exists) | Active → past. Upcoming unchanged. |

Start and complete are **manual** (ceremonies). Cannot start while an active exists.

Each sprint tracks **duration** (`1`, `2`, or `4` weeks), optional **goal**, planned end, `startedAt`, `completedAt`. Name starts as **Sprint {n}** (rename allowed). Planned end may follow start + duration; it does **not** auto-complete the sprint.

**Leftovers:** stay in the past sprint unless moved during complete (to parent or upcoming). No auto-carry that resets a Backlog **stage**.

---

## Tabs

**This Space** → **space views that are on** (Backlog, Board) → **pins** → **working tabs**

Views are shared, not closable, not pins, stay on this host. Active/upcoming are **not** tabs.

A folder (no views, no sprinting): This Space → pins → working tabs.

---

## Permissions

| Action | Who |
| ------ | --- |
| Enable/disable views; enable sprinting; start; complete | `canManage` |
| Create / rank / move on Backlog | Same as create/move documents in that tree |
| Change stage on Board | Same as editing those documents |

---

## Explicitly rejected

- Sprint or Project as an artifact kind or a Space subtype
- Backlog or board as artifacts
- Requiring sprinting to use Backlog or Board
- Requiring sprint sections when sprinting is off
- Backlog as a workflow stage (location is `space_id`)
- System-created sprints without enable (or Start for the next upcoming)
- More than one active or more than one upcoming
- DMs or regular conversations as backlog/board rows
- Auto start/complete on a timer (v1)
- Making the user assemble a Scrum/Kanban project from unlabeled primitives with no preset

---

## Open

- Linear-style automatic cycles
- Disabling sprinting after enable
- Sprint reports / burndown (Epicstory V1 reports — later here)
- Epics

---

## Changelog

| Date       | Change |
| ---------- | ------ |
| 2026-08-28 | First draft: sprints as spaces, opt-in clock, backlog sections, board of active. |
| 2026-08-29 | Split backlog, board, and sprinting. Presets for project/Kanban/Scrum intent. Board does not require sprints. No Backlog stage kind. |
| 2026-08-29 | Epicstory map: manual complete only; leftovers stay; duration/goal; workflow and types in sibling specs. |
