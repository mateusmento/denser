# Document

**Status:** Draft  
**Kind:** Capability UI (primary artifact)  
**Density:** Calm ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md))  
**Feature spec:** [FEATURE-SPECS.md — Document](../FEATURE-SPECS.md) (TBD)  
**Guideline:** [UI-SURFACE-SPEC-GUIDELINE.md](./UI-SURFACE-SPEC-GUIDELINE.md)  
**Product model:** [ARTIFACTS-AND-SPACES.md](../ARTIFACTS-AND-SPACES.md) v1 — Artifact shell + title + rich-text body  
**Presentational (Vue):** `packages/app/src/features/document/presentationals/` (Storybook `pnpm storybook:app` → `features/document/*`). No shell chrome on this surface.  
**Composer:** **DocumentComposer** — derived from [rich-text-composer.md](./rich-text-composer.md) (engine only; this file owns page chrome).

---

## Intent

Read and write the primary artifact: a titled rich-text page that stays quiet. Formatting and inserts appear on selection or focus. The page is the work — not a toolbar, not a dashboard.

v1 is **title + body**. Custom properties, comments-as-capability, board/calendar enablement, relationships, and issue workflows stay off this surface until their own specs exist. Types and extra fields: [DOCUMENT-TYPES.md](../DOCUMENT-TYPES.md). Workflow stage: [WORKFLOW.md](../WORKFLOW.md).

---

## Layout / sectioning

```text
┌─ Document surface (canvas) ──────────────────────────┐
│ Header (title + quiet identity)                      │
│ Body scroller                                        │
│   Title (page)                                       │
│   DocumentComposer (body)                            │
└──────────────────────────────────────────────────────┘
```

| Region               | Job                                   | Density                                                           |
| -------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| **Header**           | Orient: which document; quiet actions | Calm chrome; shared `h-surface-header` with other surfaces |
| **Title**            | Name the artifact                     | Large, in-flow; not a second app title bar                        |
| **DocumentComposer** | Read / write the page body            | Calm; wide measure, generous vertical rhythm                      |

Shared app shell (nav sidebar, space switcher) stays outside this surface; Document owns the content column.

Do not reuse Conversation **MessageComposer**. Comments, if they exist later, are a separate derived composer — not this page body.

---

## Sub-components

| Sub-component        | Role                                         | Spec depth                    |
| -------------------- | -------------------------------------------- | ----------------------------- |
| **DocumentHeader**   | Identity, overflow menu (move, share TBD)    | Light                         |
| **TitleEditor**      | In-place title                               | Below                         |
| **DocumentComposer** | Page-body chrome over the shared editor      | [Detailed](#documentcomposer) |
| **PermissionEmpty**  | Replaces composers when the user cannot edit | States                        |

---

## Features

| Feature                   | Where it lives                                    | Notes                                                                                  |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Read body                 | **RichTextPreview**                               | `RichTextSubtree` over the body `JSONContent`                                          |
| Edit title                | TitleEditor                                       |                                                                                        |
| Edit body                 | DocumentComposer                                  | Autosave TBD with feature spec                                                         |
| Format selection          | DocumentComposer → RichTextSelectionMenu / slash  | [Standard formatting](./rich-text-composer.md#standard-formatting)                     |
| Insert image / attachment | On focus / slash / bubble — not a permanent strip | Phased                                                                                 |
| Create document           | Shell / home create menu                          | [ARTIFACTS-AND-SPACES.md](../ARTIFACTS-AND-SPACES.md) v1 create: Space + Document only |

Deferred (not on this surface in v1): custom properties, comments, workflow, relationships, views enabled from properties.

---

## Data (UI-facing)

UI consumes the Document feature model; it does not invent a second schema.

| UI need             | Source objects / fields                                            |
| ------------------- | ------------------------------------------------------------------ |
| Title               | Artifact / Document title                                          |
| Body                | TipTap / ProseMirror JSON — not an HTML string                     |
| Identity            | Artifact id, parent Space                                          |
| Can read / can edit | Membership / permission                                            |
| Version             | Whole-entity `version` for PATCH / 409 when the feature spec lands |

Realtime / conflict: follow frontend architecture (versioned PATCH, 409 merge-retry). Details in the Document feature spec when written.

---

## Visible vs hidden UI and navigation

Chrome layers follow [VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md) decision rules.

| Layer             | Visible by default                          | Progressive / overflow                                               | Ambient                                   |
| ----------------- | ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| **1 Persistent**  | Header identity; title; body (read or edit) | —                                                                    | —                                         |
| **2 Progressive** | —                                           | Selection / focus formatting; header menu (move, share TBD); inserts | —                                         |
| **3 Ambient**     | —                                           | —                                                                    | Shortcuts, command palette, slash inserts |

No permanent formatting toolbar. Markers and inserts appear on **selection or focus**.

---

## Interactions

| Interaction        | Result                                             |
| ------------------ | -------------------------------------------------- |
| Open document      | Load permissioned artifact; mount title + body     |
| Type in title      | Local draft; persist per feature spec              |
| Type in body       | Local draft; persist per feature spec              |
| Select text        | Show bubble; apply markers                         |
| Narrow viewport    | Keep measure readable; do not add a second toolbar |
| No edit permission | Read-only body; hide editors / show explanation    |
| Load error         | Inline error + retry; don’t wipe a usable draft    |
| Conflict (409)     | Merge-retry per architecture; same-field → UX      |

Failed persist stays **inline** (retry on the page), not a toast-only recovery ([toast.md](./toast.md)).

---

## DocumentComposer

Derived from [rich-text-composer.md](./rich-text-composer.md). Document owns page chrome and persist rules. Conversation owns a separate **MessageComposer** — do not reuse that component here.

| Field       | Value                           |
| ----------- | ------------------------------- |
| Kind        | Document-derived composer       |
| Primary job | Edit the artifact body in place |
| Engine      | Shared TipTap infrastructure    |

### Layout

- In-flow under the title; wide measure; generous vertical rhythm.
- Regions: **RichTextComposer** · **RichTextSelectionMenu** (on selection). Slash `/` and `@` from infrastructure.
- No action row, no Send, no schedule. Inserts appear on selection, focus, or slash — not a permanent strip.

### Composer states

| State            | Behavior                                        |
| ---------------- | ----------------------------------------------- |
| Empty            | Body placeholder; ready to type                 |
| Drafting         | Local document; persist per feature spec        |
| Selection active | Bubble visible                                  |
| Read-only        | Infrastructure renderer; no bubble / inserts    |
| Saving / saved   | Quiet; no blocking overlay                      |
| Failed persist   | Keep draft; retry **inline**                    |
| No permission    | Host replaces with read-only or PermissionEmpty |

---

## Surface states

| State          | UI                                            |
| -------------- | --------------------------------------------- |
| Loading        | Quiet placeholder; don’t flash empty title    |
| Empty new      | Title placeholder + empty body, ready to type |
| Ready (edit)   | Title + body editors                          |
| Ready (read)   | Same layout, no bubble / inserts              |
| Error (load)   | Inline error + retry                          |
| Forbidden      | Explanation; no body payload                  |
| Saving / saved | Quiet; no blocking overlay                    |

---

## Open questions

- Autosave vs explicit save in v1.
- Document typography: same Geist size scale vs dedicated reading measure ([VISUAL-LANGUAGE.md](../VISUAL-LANGUAGE.md)).
- Cover / icon in header or deferred with properties.
- Where comments attach when that capability exists (side pane vs bottom vs separate surface).

---

## Changelog

| Date       | Change                                                         |
| ---------- | -------------------------------------------------------------- |
| 2026-08-11 | Initial Document UI surface spec (v1 title + body).            |
| 2026-08-11 | DocumentComposer derived from shared rich-text infrastructure. |
