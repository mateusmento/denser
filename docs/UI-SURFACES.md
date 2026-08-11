# UI Surfaces

**Status:** Draft scaffold — catalog of Views and capability UIs. Per-surface specs live under [`ui-surfaces/`](./ui-surfaces/). Not the design-system primitive catalog (Storybook / `@denser/design-system`).

**Audience:** Product and frontend when specifying what a screen or component must show and do.

**Related:** [VISUAL-LANGUAGE.md](./VISUAL-LANGUAGE.md), [FEATURE-SPECS.md](./FEATURE-SPECS.md), [UI-SURFACE-SPEC-GUIDELINE.md](./ui-surfaces/UI-SURFACE-SPEC-GUIDELINE.md), [PRODUCT-MODEL.md](./PRODUCT-MODEL.md) / [ARTIFACTS-AND-SPACES.md](./ARTIFACTS-AND-SPACES.md).

---

## Purpose

Inventories **how people encounter** denser. Each first-class surface gets its own file covering intent, sub-components, features, data bindings, layout, visible vs hidden chrome, and interactions.

UI Surfaces answer: *What does the user see and reach for?*  
Feature Specs answer: *What exists, what’s allowed, how does it behave?*

---

## Catalog

### Shell (shared)

| Surface | Density | Job | Spec |
| --- | --- | --- | --- |
| App shell (sidebar, top bar, space switcher) | Calm chrome | Navigate Spaces / Artifacts / Views | TBD |
| Command palette | Ambient | Accelerator + safety net | TBD |

### Views / capability UIs

| Surface | Density | Job | Spec |
| --- | --- | --- | --- |
| Document | Calm | Read / write primary artifact | TBD |
| Conversation | Calm–medium | Persistent discussion | [ui-surfaces/conversation.md](./ui-surfaces/conversation.md) |
| Backlog / list | Dense | Scan, rank, bulk-act | TBD |
| Board | Dense | Workflow by status | TBD |
| Map | Medium–dense | Spatial organize / model | TBD |
| Personal home | Calm | Root Spaces & Artifacts landing | TBD |

### Shared components (product behavior)

| Component | Used in | Job | Spec |
| --- | --- | --- | --- |
| MessageComposer | Conversation (channel / thread shapes); later artifact comments | Author and send / schedule | [conversation.md § MessageComposer](./ui-surfaces/conversation.md#messagecomposer) |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-08-10 | Scaffold + Message composer draft. |
| 2026-08-10 | Conversation surface moved to `ui-surfaces/conversation.md`; this file is the catalog index. |
