---
name: frontend-patterns
title: Frontend Patterns
impact: HIGH
description: >-
  Frontend architecture for Vue denser-style apps: presentational/container split,
  composables (sync vs UI vs ambient), feature vs module folders and reusability promotion,
  state ownership and TanStack Query/DB, async view-models, realtime ingest,
  versioned conflict (409 merge-retry), and coding style (FP, reuse, VueUse, Remeda vs
  native, Pick/Omit, ReadonlyRefOrGetter + toReadonlyRef, no unsafe HTML / handmade
  widget JS). Use when designing or reviewing
  components, slots, prop surfaces, sync composables, normalization, optimistic
  updates, sockets, folder layout, concurrency, Storybookable UI, or TS style.
  Load matching references/ and rules/ only for the decision at hand — not the whole catalog.
tags: [vue, denser, presentational, container, state, sync, composables]
---

# Frontend Patterns

**Smell rules** only when recognition + remedy are distinct; otherwise improve the reference ([bar](#smell-rule-bar)).

Key terms: [`GLOSSARY.md`](GLOSSARY.md).

## Contracts (always apply)

1. **Presentational / container** — Presentational owns markup + controllable UI (Storybook required; no MSW/sync). Container wires synchronized SoT into presentationals; **no chrome of its own**. Sync classifier: network SoT coherence → sync composable (**containers only**). Ambient ports (`useAuthUser`, …) are adapter-backed and sync-free on the presentational path.
2. **State ownership before infrastructure** — Exactly one owner per fact. **Canonical** vs **projection**. Pick Query / TanStack DB / realtime from **pressure** and **consistency need**, not taste.
3. **Sync stack** — **TanStack Query** (transport) + **TanStack DB** (normalized entities under pressure / early multi-entity default) + **sync composable** (queries & commands). Optimistic updates on **DB**; invalidate/refetch Query projections; do not hand-fan-out every query key.
4. **Version / 409** — Whole-entity monotonic `version` on PATCH; **409** → merge pending fields into server snapshot → retry; same-field → UX. Optimistic must not skip the gate.
5. **Realtime** — Another **ingest** into the same canonical replica (transport vs apply). Subscribe for owned live data; dedupe optimistic + echo with **nonce/client id**.
6. **Features compose; modules reuse** — Containers live in **features**. Modules hold reusable presentationals/composables only (**no containers**). **Zero module→module**. Packages: `design-system`, `contracts`, `api-client`. Detail: [`references/folder-structure.md`](references/folder-structure.md).
7. **Reusability promotion** — Colocated artifacts move to `modules/`, `lib/`, `design-system`, `contracts`, or `api-client` when a second consumer / shared reason-to-change / cross-boundary import urge appears — not for aesthetics. Detail: [`references/folder-structure.md`](references/folder-structure.md).
8. **Coding style** — Prefer FP and reuse; **VueUse** for browser/DOM idioms (`useStorage`, observers, media, permissions, …); Remeda OK but native-first when equivalent; `Pick`/`Omit` for projections; composable **params** use `ReadonlyRef` / `ReadonlyRefOrGetter` + `toReadonlyRef`; mutable `Ref` params only when the composable must mutate that ref. Detail: [`references/coding-style.md`](references/coding-style.md).

## Procedure

Do in order for design or review. **Done when** each step’s criterion holds.

| Step | Action | Done when |
| --- | --- | --- |
| 1 | Name the concept; classify domain vs UI | Concept named |
| 2 | State ownership (one authority) | Owner explicit; no second SoT writer |
| 3 | Canonical vs projection | What persists/syncs vs what is derived |
| 4 | Consistency need | Strong vs eventual (at least) stated |
| 5 | Sync & persistence choice | Location + mutation strategy named (Query/DB/URL/UI/…) |
| 6 | Layer & folder | P vs C; feature vs module; promote only under reusability pressure ([`folder-structure.md`](references/folder-structure.md)) |
| 7 | Load depth | Open matching **reference** / **rule** from the maps below — not the whole catalog |

## Smell rule bar

Earn a `rules/` file only when recognition + remedy are not just “follow the reference.” In-reference smell lists are fine for contract violations.

**Impact** on files below: `HIGH` = SoT / Storybook / multi-client correctness; `MEDIUM` = maintainability / reuse / layering; `LOW` = style / local clarity.

## Reference load map

| Title | Impact | Tags | Path |
| --- | --- | --- | --- |
| Presentational / Container | HIGH | presentational, container, storybook, ambient | [`references/presentational-container.md`](references/presentational-container.md) |
| Composables | HIGH | composable, sync, query, tanstack-db | [`references/composables.md`](references/composables.md) |
| State management | HIGH | state, ownership, canonical, normalize | [`references/state-management.md`](references/state-management.md) |
| Realtime | HIGH | realtime, socket, ingest, subscribe | [`references/realtime.md`](references/realtime.md) |
| Conflict / version | HIGH | conflict, version, 409, concurrency | [`references/conflict-version.md`](references/conflict-version.md) |
| Async UX | MEDIUM | async, ux, view-model, loading | [`references/async-ux.md`](references/async-ux.md) |
| Folder structure | MEDIUM | folders, feature, module, promotion, packages | [`references/folder-structure.md`](references/folder-structure.md) |
| Coding style | LOW | typescript, fp, style, vueuse, readonly-ref | [`references/coding-style.md`](references/coding-style.md) |

## Rule index

### State & realtime

| Rule | Impact | When |
| --- | --- | --- |
| [`normalization-pressure`](rules/normalization-pressure.md) | HIGH | Entity fan-out / overlapping queries → TanStack DB |
| [`duplicated-ownership`](rules/duplicated-ownership.md) | HIGH | Two authoritative replicas of the same fact |
| [`persisted-derivation`](rules/persisted-derivation.md) | HIGH | Computed/projection stored as if canonical |
| [`undeduped-echo`](rules/undeduped-echo.md) | HIGH | Optimistic row + socket/HTTP echo = duplicates |

### Layers & composables

| Rule | Impact | When |
| --- | --- | --- |
| [`presentational-sync-composable`](rules/presentational-sync-composable.md) | HIGH | Presentational calls sync |
| [`presentational-imports-container`](rules/presentational-imports-container.md) | HIGH | Presentational imports container |
| [`container-owns-markup`](rules/container-owns-markup.md) | HIGH | Container owns chrome |
| [`presentational-container-seam`](rules/presentational-container-seam.md) | HIGH | Slot for wired region |
| [`ui-composable-does-sync`](rules/ui-composable-does-sync.md) | HIGH | UI/ambient composable does network SoT sync |
| [`composable-query-command-api`](rules/composable-query-command-api.md) | HIGH | Sync composable leaks transport/DB |
| [`ad-hoc-domain-types`](rules/ad-hoc-domain-types.md) | MEDIUM | Types drift from Zod/`contracts` |
| [`composable-multiple-reasons`](rules/composable-multiple-reasons.md) | MEDIUM | One composable, many reasons to change |
| [`pure-helper-as-composable`](rules/pure-helper-as-composable.md) | LOW | Pure helper named `useX` |
| [`handmade-interactivity`](rules/handmade-interactivity.md) | MEDIUM | Raw DOM widget JS — DS/library first; don’t dump feature glue into DS |
| [`unsafe-html`](rules/unsafe-html.md) | HIGH | `innerHTML` / `v-html` / `insertHTML` of unsanitized strings |

### Slots & prop surfaces

| Rule | Impact | When |
| --- | --- | --- |
| [`forwarding-props`](rules/forwarding-props.md) | MEDIUM | Forwards props/events unused (pass-through / drill) |
| [`giant-prop-bags`](rules/giant-prop-bags.md) | MEDIUM | Flat dump the component renders → view-model slice |
| [`render-flags`](rules/render-flags.md) | MEDIUM | Flags/enums only to pick child trees |
| [`flatten-nested-tree`](rules/flatten-nested-tree.md) | MEDIUM | Feature-nested trees → flat slot composition |
