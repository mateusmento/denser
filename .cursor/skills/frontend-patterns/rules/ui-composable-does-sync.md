---
title: UI composable does sync
impact: HIGH
description: >-
  UI/ambient composable performs network SoT sync.
tags: [composable, sync, bucket]
---

## Trigger

A composable classified as **UI / local** or **ambient port** performs **network SoT sync** (fetch/cache/stale/refresh, invalidate, optimistic server mutation) — or a `useX` mixes UI concerns with sync in one unit.

Contract: [`references/composables.md`](../references/composables.md).

```ts
// ❌ UI composable that syncs
export function useAssigneeMenuOpen() {
  const open = ref(false)
  const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers }) // sync
  return { open, users: data }
}
```

## Rule

Split: **sync** composable (containers only) owns Query/DB/coherence; **UI/local** keeps open state, layout, browser APIs. Ambient ports stay adapter reads — if they need sync, the sync lives in a sync composable or the app adapter behind the port, not in a presentational-callable UI composable.

## When not

- The composable is intentionally **Sync** — reclassify and restrict callers to containers ([`presentational-sync-composable`](presentational-sync-composable.md)).
- Browser/network used only for a **frontend-only** feature with no domain entity SoT (e.g. upload-to-S3 helper that isn’t your domain cache) — still prefer a clear boundary; don’t pretend it’s ambient.

## Leading word

**ui composable does sync**
