---
title: State management
impact: HIGH
description: >-
  Ownership, canonical vs projection, consistency, pressure, normalize, mutation coherence.
tags: [state, ownership, canonical, normalize]
---

# State management

Architecture contract for **where state lives**, **how it is represented**, and **how it stays coherent** with its SoT. Library wiring defaults live in [`composables.md`](composables.md); **who** may call sync lives in [`presentational-container.md`](presentational-container.md). Async loading/error/retry UX: [`async-ux.md`](async-ux.md).

Model concepts before libraries. Choose infrastructure from **pressure**, not preference.

Leading words: **ownership**, **canonical**, **projection**, **pressure**.

State ownership, canonical/projection, consistency need: also [`../GLOSSARY.md`](../GLOSSARY.md).

---

## Procedure (do not skip)

Do **not** reach for Query, DB, or realtime until **ownership**, **canonical vs projection**, and **consistency need** are clear for the concept. Libraries don’t require that analysis — you must.

### 1 — Concept

Name the domain or UI concept (`Issue`, `selectedIssueId`, `searchQuery`, sidebar open). Domain vs UI interaction matters for later steps.

**Done when:** the concept is named and classified domain vs UI.

### 2 — Ownership

Every piece of state has **exactly one owner** (authority for the canonical value). Typical owners: **backend**, **URL**, **browser** (component/feature UI), **user preferences** (local). Never duplicate ownership of the same fact across stores.

**Done when:** owner is explicit; no second writer of the same SoT.

### 3 — Representation (canonical vs projection)

- **Canonical** — the representation you persist/sync as the client’s replica of SoT facts (for denser domain entities: usually **TanStack DB** rows + relationships, fed by Query/network).
- **Projection** — derived view for a screen/feature (list windows, search hits, view-model slices). Prefer **compute**; do not persist projections if that creates extra sync.

Represent **domain concepts**, not API endpoint shapes. Multiple features may share canonical entities; each may own different projections.

**Done when:** you know what is canonical vs derived.

### 4 — Consistency need

Consistency is a **product** decision: must the UI be immediately coherent after a command, or is eventual OK? Can the user refresh? Will stale data confuse?

**Done when:** strong vs eventual (and for which fields/features) is stated.

### 5 — Sync & persistence choice

Pick storage and sync from owner + lifetime + consistency — not convenience.

| Kind | Denser default |
| --- | --- |
| Ephemeral UI | Component state / UI·local composable |
| Shareable/bookmarkable “where the user is” | **URL** |
| App/shell client singleton | **`createGlobalState`** |
| Page-scoped shared wiring (WS listeners, etc.) | **`createSharedComposable`** — see [`realtime.md`](realtime.md) |
| Synchronized server data (transport) | **TanStack Query** |
| Synchronized domain entities / relationships (canonical replica) | **TanStack DB** when normalize applies (below) |
| Wire types | Zod in **`contracts`** |

**Mutation coherence (default):**

- **Optimistic update on DB** when the user edits domain data already on screen — then reconcile with the server (confirm / rollback).
- **Version-gated PATCH** with **409 merge-retry** for concurrent edits — [`conflict-version.md`](conflict-version.md).
- **Invalidate / refetch Query** for list/search windows and projections that are cheap to rebuild or unsafe to patch by hand.
- Do **not** make hand-patching every Query key the primary strategy — that fan-out **is** the smell that pushes you to DB.

Sync composables orchestrate Query ↔ DB and expose **queries & commands** to containers.

**Done when:** persistence location and mutation strategy are named for this concept.

---

## Normalize (TanStack DB)

**Pressure rule:** introduce / lean on a normalized entity store when **synchronization fan-out** dominates — hard to find every cache that holds an entity, cross-feature mutations, optimistic updates painful, sync code larger than fetch code, rich relationships, same entity in many features.

**Denser early default:** multi-entity domains with shared reads across features and optimistic/relationship updates **start with DB** once more than one feature consumes the same entities. Do **not** normalize a single isolated list with one consumer “because it’s cleaner.”

Signals (several together): query explosion, projection explosion, duplicated ownership of the same entity. Bundled smell rule: [`../rules/normalization-pressure.md`](../rules/normalization-pressure.md).

Realtime should **patch canonical DB** (projections follow), not invent a third write path. Detail: [`realtime.md`](realtime.md).

---

## Smells

| Smell | Where |
| --- | --- |
| Duplicated ownership | [`../rules/duplicated-ownership.md`](../rules/duplicated-ownership.md) |
| Persisted derivation | [`../rules/persisted-derivation.md`](../rules/persisted-derivation.md) |
| Query / projection explosion, cache fan-out, premature normalize | [`../rules/normalization-pressure.md`](../rules/normalization-pressure.md) |
| God store | In-reference (below) — not a separate rule |

### God store

One store / global bag / `useAppState` holds **unrelated concepts** with **different owners and lifetimes** (UI chrome + server entities + URL selection + unrelated features).

**Fix:** split by ownership and lifetime (procedure above + [`composables.md`](composables.md) sharing defaults). Prefer feature vertical slices. If the pain is the **same entity** copied many ways → [`normalization-pressure`](../rules/normalization-pressure.md), don’t grow the bag.

**Not this smell:** one cohesive sync composable with related queries/commands; narrow `createGlobalState` for a single shell concern (theme, locale).

---

## Related

| Topic | Where |
| --- | --- |
| Sync composable stack, sharing | [`composables.md`](composables.md) |
| Container vs presentational | [`presentational-container.md`](presentational-container.md) |
| Loading / error / retry / dedupe UX | [`async-ux.md`](async-ux.md) |
| View-model slices for UI props | [`../GLOSSARY.md`](../GLOSSARY.md) |
