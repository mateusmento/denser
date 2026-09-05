# UI Surfaces

**Status:** Draft scaffold — catalog of Views and capability UIs. Per-surface specs live under [`ui-surfaces/`](./ui-surfaces/). Not the design-system primitive catalog (Storybook / `@denser/design-system`).

**Audience:** Product and frontend when specifying what a screen or component must show and do.

**Related:** [VISUAL-LANGUAGE.md](./VISUAL-LANGUAGE.md), [FEATURE-SPECS.md](./FEATURE-SPECS.md), [PLANNING-DOMAIN.md](./PLANNING-DOMAIN.md), [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md).

---

## Purpose

Inventories **how people encounter** denser. Each first-class surface gets its own file covering intent, sub-components, features, data bindings, layout, visible vs hidden chrome, and interactions.

UI Surfaces answer: _What does the user see and reach for?_  
Feature Specs answer: _What exists, what’s allowed, how does it behave?_

---

## Catalog

### Shell (shared)

| Surface                                      | Density     | Job                                   | Spec                               |
| -------------------------------------------- | ----------- | ------------------------------------- | ---------------------------------- |
| App shell (sidebar, tab bar, space switcher) | Calm chrome | Navigate spaces, tabs, DMs, artifacts | [shell.md](./ui-surfaces/shell.md) |
| Theme                                        | Calm        | Light / dark / system                 | [theme.md](./ui-surfaces/theme.md) |
| Toast                                        | Calm        | Transient non-blocking feedback       | [toast.md](./ui-surfaces/toast.md) |
| Command palette                              | Ambient     | Accelerator + safety net              | TBD                                |

### Views / capability UIs

| Surface        | Density      | Job                                                                         | Spec                                             |
| -------------- | ------------ | --------------------------------------------------------------------------- | ------------------------------------------------ |
| Document       | Calm         | Read / write primary artifact                                               | [document.md](./ui-surfaces/document.md)         |
| Conversation   | Calm–medium  | Persistent discussion (artifact tab or DM)                                  | [conversation.md](./ui-surfaces/conversation.md) |
| Meeting room   | Medium       | Room history + live/scheduled meetings (SFU)                              | [meeting-room.md](./ui-surfaces/meeting-room.md) — domain: [MEETINGS.md](./MEETINGS.md) |
| This Space     | Calm         | Browse child spaces + regular artifacts                                     | [shell.md](./ui-surfaces/shell.md) (tab content) |
| Backlog / list | Dense        | Space **view** — this space’s documents; sprint sections if sprinting is on | [backlog.md](./ui-surfaces/backlog.md)           |
| Board          | Dense        | Space **view** — workflow stages; active sprint only if sprinting is on     | [board.md](./ui-surfaces/board.md)               |
| Map            | Medium–dense | Spatial organize / model                                                    | TBD                                              |
| Personal home  | Calm         | Root Spaces & Artifacts landing                                             | TBD                                              |

### Shared infrastructure

| Piece              | Derived by                                                                                                                              | Job                                                                    | Spec                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Rich-text composer | **DocumentComposer** ([document.md](./ui-surfaces/document.md)); **MessageComposer** ([conversation.md](./ui-surfaces/conversation.md)) | RichTextComposer, SelectionMenu, Preview/Subtree, shared `rt-*` styles | [rich-text-composer.md](./ui-surfaces/rich-text-composer.md) |

---

## Changelog

| Date       | Change                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| 2026-09-04 | Catalog Meeting room surface (TBD file); pointer to Meeting rooms feature spec.                |
| 2026-08-10 | Scaffold + Message composer draft.                                                             |
| 2026-08-10 | Conversation surface moved to `ui-surfaces/conversation.md`; this file is the catalog index.   |
| 2026-08-11 | App shell spec: Theme + Toast ownership (`ui-surfaces/shell.md`).                              |
| 2026-08-11 | Split Theme, Toast, rich-text composer, and Document into their own surface specs.             |
| 2026-08-11 | Rich-text composer is shared infrastructure; Views derive DocumentComposer / MessageComposer.  |
| 2026-08-26 | This Space tab; backlog/board as space views; shell tab bar + DM nav per ARTIFACTS-AND-SPACES. |
| 2026-08-28 | Backlog and board surface drafts; sprint clock in BACKLOG-AND-SPRINTS.md.                      |
| 2026-08-29 | Backlog/board independent of sprinting; project presets.                                       |
| 2026-08-29 | Board/document surfaces point at workflow and document-type specs.                             |
