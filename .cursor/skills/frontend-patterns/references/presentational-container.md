---
title: Presentational / Container
impact: HIGH
description: >-
  P/C split, sync classifier, ambient ports, Storybook for presentationals, container composition-only.
tags: [presentational, container, storybook, ambient]
---

# Presentational / Container

Architecture contract for component layers. Smell rules point here; this file is not a smell checklist.

**Why:** separate reasons to change — visual/UI design vs synchronized domain behavior — so Storybook can catalog the app UI in small pieces and redesigns are not tangled with fetch/cache/mutation noise.

Classify by **behavior**, not folder name.

---

## Synchronized state

**Synchronized state** is client-held data whose **source of truth (SoT)** is **external** (typically the backend) and whose frontend job is to **stay coherent with that SoT over time** — via fetch/subscribe, caching, staleness, refresh, and post-mutation **invalidation or optimistic update**.

Not every mechanism must appear. If the composable’s reason to exist is **coherence with a remote SoT**, it is sync. Projections/shapes may vary by view; they still denote the same domain entities.

**Source of truth (SoT):** the system authoritative for the canonical value. For synchronized domain data, that is usually the **backend** (API / database). The client cache is a **replica**, not the SoT — unless product policy explicitly makes the client authoritative (rare; call that out). Ambient identity may be *derived* from cookie/URL/`localStorage` in an adapter; that does not by itself make presentational reads “sync.”

**Not synchronized** (for this contract): ephemeral UI state; pure local drafts/preferences with no remote coherence job; **ambient port** reads (adapter-backed, Storybook-fixturable) even when the app adapter reads a cookie or path.

**Classifier:** if a unit reads or writes synchronized external SoT semantics, it is on the **container / sync-composable** side — not presentational.

Sync **behavior** is implemented in **composable functions** (and stores they wrap). Components classify by **which composables they call**, not by re-implementing sync inside the SFC.

---

## Presentational

Owns **markup, styles, a11y**, and **controlled** UI behavior.

| May | Must not |
| --- | --- |
| UI-local state (open/closed, hover, keyboard nav) | Call **sync** composables / Query / mutation caches |
| **UI/local** composables (virtualizer, DnD local, browser APIs with no network SoT sync) | Import **containers** |
| **Ambient ports** (`useAuthUser`, `useCurrentWorkspace`) when adapter-backed | Own network-backed sync |
| Domain vocabulary in the UI (`IssueAssigneeMenu`) | |
| Slots / compound APIs **enough** to avoid smells and vary call sites | Over-flex like a design system “for reuse” |

**Controllable state:** ephemeral UI state may stay internal. Any state a container must drive or observe is **controllable** — `v-model` and/or props + events (e.g. assignee selection).

**Storybook (mandatory):** every presentational has stories. Stories live in the feature/module **`stories/`** sibling folder (see [`folder-structure.md`](folder-structure.md)); they render **without MSW, real API, or sync adapters** — fixture ambient ports + props/`v-model` controls. The more behavior stories exercise, the better.

**API shape:** call-site-coupled. Favor separation of concerns over inventing empty shells for every `div`. Provide slots/compounds for (#1) smell avoidance and (#2) real call-site variation — not maximal creative reuse.

---

## Container

A component that **requires synchronized state** (via sync composables/stores). Thin **wiring SFC**: maps domain/sync → presentational props, events, `v-model`, and slot fills.

**Template may only:**

- render **presentational** or **design-system** roots  
- fill **slots** with presentational or container children  
- pass props / listen to events / `v-model`

**No** layout chrome, **no** styling/classes, **no** raw visual structure of its own. Need a wrapper `div` for layout → that chrome belongs in a presentational (or a parent presentational slot region).

Containers are **out of the default Storybook UI catalog** (wired demos optional later, separate from the presentational surface).

---

## Composable buckets

Depth: [`composables.md`](composables.md). Summary:

| Bucket | Who may call | What |
| --- | --- | --- |
| **Sync** | Containers only | External SoT coherence (Query/DB orchestration) |
| **Ambient port** | Presentational + container | Adapter-backed identity/context |
| **UI / local** | Presentational + container | UI / browser / frontend-only features without network SoT sync |

Network-backed cache/sync ⇒ **Sync**. Ambient ports: app vs Storybook adapters — see composables + this file’s Storybook bar.

---

## Design system vs presentational

| | Design system | Presentational |
| --- | --- | --- |
| Goal | Reuse established UI patterns anywhere | Feature/domain UI separated from sync |
| API | High composability | Enough slots/compounds for smells + call sites; favor SoC |
| Domain | Agnostic | Domain vocabulary OK |
| Stories | Yes | **Mandatory**; no sync |

Presentational is **not** a mini design system.

---

## Feature boundaries (light)

Prefer **feature-driven vertical slices** (domain + frontend-specific domains). Boundaries are composables and reactive state — sharing defaults in [`composables.md`](composables.md). This contract only places **who** may call sync.

---

## Related smell rules

| Concern | Rule |
| --- | --- |
| Presentational calls sync | [`rules/presentational-sync-composable.md`](../rules/presentational-sync-composable.md) |
| Presentational imports container | [`rules/presentational-imports-container.md`](../rules/presentational-imports-container.md) |
| Container owns markup | [`rules/container-owns-markup.md`](../rules/container-owns-markup.md) |
| Slot seam when P needs wired region | [`rules/presentational-container-seam.md`](../rules/presentational-container-seam.md) |
| Do not use provide/inject to fix forwarding | [`rules/forwarding-props.md`](../rules/forwarding-props.md) — context ≠ unpiping; who may read sync is this contract |
