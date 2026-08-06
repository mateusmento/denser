---
title: Normalization pressure
impact: HIGH
description: >-
  Entity fan-out / overlapping queries — introduce TanStack DB.
tags: [normalize, tanstack-db, state]
---

## Trigger

**Synchronization / entity fan-out pressure** — several of these show up together (one alone is a hint; a cluster means act):

1. **Duplicate data** — same entity (by id) stored in multiple places and drifting out of sync  
2. **Deeply nested state** — complex object graphs that need excessive spreading/cloning to patch one field  
3. **Overlapping fetches** — multiple API endpoints / query shapes returning the same entities  
4. **Update complexity** — a simple domain change must touch many state locations by hand  
5. **Reference tracking pain** — relationships between entities are hard to keep consistent  
6. **Scattered update churn** — unrelated UI re-renders because the same fact is copied across trees  
7. **Boilerplate** — growing manual `upsertXInList` / patch-every-cache helpers  

Also matches when: entities have **ids and relationships**; **multiple views** show the same data; updates arrive from **multiple sources** (HTTP, websocket, polling); state complexity has outgrown simple UI or a single list cache.

Contract: [`references/state-management.md`](../references/state-management.md) (**pressure**, normalize). Stack: [`references/composables.md`](../references/composables.md) (Query + TanStack DB).

## Rule

Introduce (or lean on) an **entity-oriented normalized store** (**TanStack DB**) as the **canonical** client replica of domain entities. Sync composables:

- ingest HTTP/Query (and later realtime) into DB  
- **optimistically patch DB** for in-view edits; reconcile with the server  
- **invalidate/refetch Query** for projections that are cheap or unsafe to patch by hand  
- expose **queries & commands** — do not make hand-fan-out across query keys the primary strategy  

Projections and view-models **read from** canonical entities (or Query windows fed by them); they are not a second SoT.

## When not

- **Single isolated list**, one consumer, no cross-feature identity — Query (or local state) is enough; do not normalize “for cleanliness.”  
- **UI-only** state (selection, open/closed, drafts with no shared entity id graph).  
- **Premature normalization** — theorizing a perfect graph before duplicate/sync pain (or denser’s early default: **more than one feature** already shares the same entities with optimistic/relationship updates).  
- Fixing presentational prop drill with a store — wrong layer ([`forwarding-props`](forwarding-props.md) / slots).

## Leading word

**normalization pressure**
