---
title: Composables
impact: HIGH
description: >-
  What a composable is, Sync/Ambient/UI buckets, sharing, Query+DB stack, schemas/types.
tags: [composable, sync, query, tanstack-db]
---

# Composables

Architecture contract for composable functions. Smell rules point here. Layer who-may-call rules stay in [`presentational-container.md`](presentational-container.md); this file owns **what a composable is**, **buckets**, **sharing**, **sync stack defaults**, and **schemas/types**.

---

## What a composable is

A **composable** is a **reusable function** that draws a **cohesive feature boundary** (**one reason to change**). It **encapsulates state, behavior, and/or hooks**, exposing **queries** (read models / reactive results) and **commands** (actions that change state or trigger effects). It is **not** a Vue SFC.

**Not composables:**

- Pure non-reactive helpers → `lib/` (or equivalent) — do not prefix with `use` or wrap in a fake composable
- Unrelated grab-bags (multiple reasons to change in one `useX`)
- A substitute for a container’s wiring template (chrome-free composition stays in the container SFC)

Buckets below classify **relationship to SoT** — they do not replace feature cohesion.

---

## Buckets

| Bucket | Who may call | What |
| --- | --- | --- |
| **Sync** | Containers only | Coherence with external SoT — see synchronized state in [`presentational-container.md`](presentational-container.md) |
| **Ambient port** | Presentational + container | Adapter-backed identity/context; no sync on the presentational path |
| **UI / local** | Presentational + container | UI state; browser APIs; frontend-only features (screen recording, DnD) **unless** they sync entities over the network |

Network-backed cache/sync semantics ⇒ **Sync**, even if the composable also touches the DOM.

---

## Sharing: instance lifetime

Prefer the **simplest** mechanism that matches lifetime (less bundle footprint).

| Need | Default |
| --- | --- |
| Feature-local logic; caller owns setup | Plain **`useX` composable** |
| Shared across instances while the tree is mounted; setup/teardown with subscribers (WebSocket handlers, DOM listeners, shared actions) | **`createSharedComposable`** ([VueUse](https://vueuse.org/shared/createsharedcomposable/)) |
| True app-wide client singleton (shell/UI global) | **`createGlobalState`** ([VueUse](https://vueuse.org/shared/createglobalstate/)) |
| Synchronized **server** entity data | Sync stack below — **not** a global client key-value store as the entity SoT replica |

`createSharedComposable` over `createGlobalState` when wiring is **page-/tree-scoped** and must be shared with mount-tied setup. Socket listeners / room joins: [`realtime.md`](realtime.md).

---

## Sync stack (denser defaults)

| Layer | Library | Role |
| --- | --- | --- |
| Transport & query cache | **TanStack Query** | HTTP, query keys, stale/refetch, server-talking mutations |
| Normalized entities & relationships | **TanStack DB** | Canonical client entity graph; efficient optimistic patches without hand-updating every list cache |
| Orchestration | **Sync composable** | Wires Query ↔ DB; exposes **queries and commands** to **containers** |

**Split:** Query does not replace the normalized store; DB does not replace HTTP/query lifecycle. Containers consume the composable’s query/command API — not raw cache keys as the primary surface.

**When / why** to normalize, ownership, canonical vs projection, optimistic vs invalidate: [`state-management.md`](state-management.md).

Optimistic updates are expected for quick feedback; normalization is how relationship-spanning domain updates stay coherent.

---

## Schemas and types

| Kind | Home |
| --- | --- |
| API / backend-shared vocabulary (Zod + `z.infer`) | **`contracts` package** |
| HTTP call shapes / mappers over contracts | **`api-client` package** |
| Composable-local types | **Colocate** with the composable (same file or sibling types file) |
| Types reused across features/modules/views | app **`lib/types`** (see [`folder-structure.md`](folder-structure.md)) |

Infer wire types from Zod in `contracts`. Sync composables prefer **`api-client`** over raw `fetch`. Do not redefine parallel interfaces that drift ([`ad-hoc-domain-types`](../rules/ad-hoc-domain-types.md)).

Frontend-only shapes never go in `contracts`. Apply **reusability promotion** of colocated types to `lib/types` on multi-consumer pressure — same rule as folders ([`folder-structure.md`](folder-structure.md)).

---

## Public surface style

Prefer **`ReadonlyRef` / `ReadonlyRefOrGetter`** on composable **parameters** that are only read; normalize with **`toReadonlyRef`**; take mutable `Ref` only when the composable must mutate that ref. Pure helpers stay in `lib/`, not fake `useX`. Full habits: [`coding-style.md`](coding-style.md).

---

## Relationship to components

- **Containers** call sync composables (and may call ambient / UI·local).
- **Presentationals** may call ambient ports and UI·local only — see [`presentational-container.md`](presentational-container.md) and [`../rules/presentational-sync-composable.md`](../rules/presentational-sync-composable.md).
- Composables hold behavior; container SFCs remain composition-only chrome-free wiring.

---

## Related smell rules

| Concern | Rule |
| --- | --- |
| UI/local or ambient does network SoT sync | [`../rules/ui-composable-does-sync.md`](../rules/ui-composable-does-sync.md) |
| Ad-hoc types drift from Zod / `contracts` | [`../rules/ad-hoc-domain-types.md`](../rules/ad-hoc-domain-types.md) |
| Multiple reasons to change in one composable | [`../rules/composable-multiple-reasons.md`](../rules/composable-multiple-reasons.md) |
| Pure helper wrapped as `useX` | [`../rules/pure-helper-as-composable.md`](../rules/pure-helper-as-composable.md) |
| Sync composable doesn’t expose queries/commands | [`../rules/composable-query-command-api.md`](../rules/composable-query-command-api.md) |
| Presentational calls sync | [`../rules/presentational-sync-composable.md`](../rules/presentational-sync-composable.md) |
| Who may call sync / ambient / Storybook | [`presentational-container.md`](presentational-container.md) |
| View-model slices | [`../GLOSSARY.md`](../GLOSSARY.md) |
