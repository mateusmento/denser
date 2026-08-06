---
title: Composable query/command API
impact: HIGH
description: >-
  Sync composable leaks transport/DB instead of queries and commands.
tags: [composable, sync, api]
---

## Trigger

A **sync** composable (or shared sync factory) does not expose a clear **query / command** surface — callers poke Query keys, DB collections, or transport details directly, or the composable only re-exports raw library handles without a feature API.

Violates: encapsulate state/behavior/hooks **exposing queries and commands** — [`references/composables.md`](../references/composables.md).

```ts
// ❌ Container must know cache keys / DB guts
export function useIssues() {
  return { queryClient, issuesCollection }
}
```

## Rule

Expose **queries** (reactive read models / projected lists/entities the UI needs) and **commands** (search, loadMore, update, …). Keep Query ↔ DB orchestration **inside** the composable. Containers map that API → presentational props/events.

```ts
// ✅
export function useIssueSearch(workspaceId: Ref<string>) {
  // Query + DB inside…
  return {
    list, // query / read model
    search, // command
    loadMore, // command
  }
}
```

## When not

- **UI/local** composables — queries/commands language is mainly for sync/feature orchestration; UI can expose simpler state + actions.
- Deliberate low-level infra modules used **only** by sync composables (not by containers) — containers still must not import them.

## Leading word

**composable query command API**
