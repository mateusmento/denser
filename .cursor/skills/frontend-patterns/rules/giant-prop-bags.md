---
title: Giant prop bags
impact: MEDIUM
description: >-
  Flat dump the component renders — use a view-model slice.
tags: [props, view-model]
---

## Trigger

The component (or leaf) **does render** a wide flat dump of related fields — sibling props that read like a store/API dump for **one UI section**.

Fires when **either** holds:

1. **~8+ related fields** for one section the component renders (heuristic, not a hard law), **or**
2. A **repeated async cluster** at any size — e.g. `items` + `loading` + `hasMore` + `error` / `loadingMore` — instead of a shared type, **or**
3. **Emit fan-out** — many sibling emits on one component where several only configure a nested wired subtree (often paired with extra props like `membersView` that the shell does not render itself)

```ts
// ❌ Flat dump the presentational actually renders
defineProps<{
  loading: boolean
  error: string | null
  groups: GithubPullRequestGroup[]
  // …and more sibling PR fields
}>()
```

**Sibling smell:** if the bag is piped through layers that **do not** render those fields (only so a deep leaf can), that is **giant prop bags as drill fuel** under [`forwarding-props`](forwarding-props.md) → slot / flatten the pipe. Same surface (“too many props”), different predicate: *does this component use the fields?* **Emit fan-out** with a slotted wired child → slot the region ([`presentational-container-seam`](presentational-container-seam.md)) and keep view-model slices to what the shell renders.

## Rule

Compress into a **view-model slice** — see [`GLOSSARY.md`](../GLOSSARY.md). Group by UI section; use shared async types when the cluster matches a known pattern. Commands stay events.

```ts
// ✅ View-model slice — one prop per section
type GithubPrView = {
  loading: boolean
  error: string | null
  groups: GithubPullRequestGroup[]
}

defineProps<{ pr: GithubPrView }>()
```

```ts
// ✅ Repeated async cluster — shared type even under 8 fields
defineProps<{ list: PaginatedListView<IUser> }>()
// @search / @load-more remain emits — not fields on the slice
```

```ts
// ✅ Presentational slice — fields the surface renders
type SpaceContentView = {
  space: SpaceSummary
  childSpaces: readonly SpaceSummary[]
  artifacts: readonly ArtifactSummary[]
}

defineProps<{ view: SpaceSurfaceView; content?: SpaceContentView }>()
// membership/settings commands stay on SpaceMembersPanel — filled via #members slot
```

If a region is still a **wired feature subtree** the shell should not configure by props, open a slot ([`presentational-container-seam`](presentational-container-seam.md)) — do not grow the slice or emit list to smuggle container wiring.

```ts
// Container maps domain → slice
const list = computed(() =>
  toPaginatedListView({
    ...memberSearch,
    items: memberSearch.members.map((m) => m.user),
  }),
)
```

## When not

- Middle layers **only forward** the bag → [`forwarding-props`](forwarding-props.md), not a slice on the pipe.
- Few unrelated props the component consumes — leave them flat; do not invent a slice for two fields.
- Variation is **which child tree** to render → [`render-flags`](render-flags.md) / slots, not a fatter view-model.

## Leading word

**giant prop bag**
