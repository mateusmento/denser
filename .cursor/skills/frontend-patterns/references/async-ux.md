---
title: Async UX
impact: MEDIUM
description: >-
  Loading/error/retry and shared async view-model families for presentational props.
tags: [async, ux, view-model, loading]
---

# Async UX

Contracts for **how async read/write status reaches the UI** — not spinner tutorials. Ownership and sync strategy: [`state-management.md`](state-management.md). Who may call sync: [`presentational-container.md`](presentational-container.md). Orchestration: [`composables.md`](composables.md).

Presentational renders status + emits commands; **sync composable** owns request lifecycle; **container** maps composable → view-models / events.

---

## Read async

Expose read status through **shared typed view-models**, not ad-hoc boolean soup (`isLoading` + `isFetching` + `isRefetching` + `hasError` as siblings).

Those types **live in `lib` (or equivalent) and evolve** with product pressure — do not treat today’s names/fields as frozen law.

| Family | Purpose | Current shared examples (evolve as needed) |
| --- | --- | --- |
| Single fetch | One-shot read | `AsyncDataView<T>` — data + loading + error |
| Forward window | Search / scroll-next infinite list | `PaginatedListView<T>` — items + loading + loadingMore + hasMore (+ error) |
| Bidirectional / sliding window | Chat, quote jump, cursor `next`+`prev`, eviction | `hasNext` / `hasPrev`, `loadingNext` / `loadingPrev` (or `loadingDirection: 'next' \| 'prev' \| null`); keep initial `loading` separate — don’t shoehorn into forward-only `hasMore` |
| Feature view-model slice | Section UI that embeds one of the above | Domain-named slice wrapping a shared async family |

One **coherent status** per query surface: idle / loading / success / error / empty (empty = success with no items — don’t overload error).

Map Query (or equivalent) → these shapes in the **sync composable or container** (`toPaginatedListView`, etc.). See [`../GLOSSARY.md`](../GLOSSARY.md) (**view-model slice**).

**Commands stay outside the read slice** — `@retry`, `@load-next` / `@load-prev` / `@load-more`, `@search`, `@jump-to` are events/commands, not fields on the read view-model.

---

## Write async

Mutation in-flight and mutation errors use a **command-oriented** surface (`AsyncMutationState`: busy + error, or per-command busy), **not** stuffed into the read view-model.

Optimistic path (see state-management): UI may already show DB-updated data while the command is busy; still expose command error/rollback to the presentational that initiated the action (toast region, inline error on the control, etc.).

---

## Dedupe

Identical in-flight **reads** for the same key/input **share one request** (TanStack Query default — keep it). Do not parallel-fire the same query from N containers/composables as separate undocumented calls.

Writes: do not double-submit the same command without an idempotency / disable-while-busy policy (presentational: disable or ignore re-entry while `busy`).

---

## Retry

| Kind | Policy |
| --- | --- |
| Transient **read** failures | Bounded automatic retry at Query layer where safe; after exhaustion, surface **error** + user **retry command** |
| **Mutations** | No blind infinite retry. If optimistic update already applied, retry/rollback follows the sync composable’s reconciliation policy — don’t refetch-spam without a rule |
| User-initiated | Presentational emits retry / loadNext / loadPrev / search / jumpTo; composable performs the request |

---

## Boundary checklist

| Layer | Owns |
| --- | --- |
| Sync composable | Fetch/mutate, dedupe keys, retry policy, map to queries/commands |
| Container | Map to view-models + wire events; no chrome |
| Presentational | Render shared async view-models + mutation busy-error; emit retry / loadNext / loadPrev / search / jumpTo |

Storybook: presentational stories use **fixture** view-models (loading/error/empty/success) — no MSW required for the catalog.

---

## Smells

| Smell | Meaning |
| --- | --- |
| Boolean soup | Flat loading/error flags instead of a shared async view-model |
| Mutation in read model | `saving` / mutate error fields on the fetch view-model |
| Duplicate in-flight reads | Same key fired N times without sharing |
| Presentational fetches | Read/write lifecycle inside presentational ([`presentational-sync-composable`](../rules/presentational-sync-composable.md)) |
| Retry with no command | Error UI with no way for the user to retry a failed read |

---

## Related

| Topic | Where |
| --- | --- |
| Optimistic vs invalidate | [`state-management.md`](state-management.md) |
| Query/command API on composables | [`composables.md`](composables.md) / [`../rules/composable-query-command-api.md`](../rules/composable-query-command-api.md) |
| Giant prop bags → async clusters | [`../rules/giant-prop-bags.md`](../rules/giant-prop-bags.md) |
