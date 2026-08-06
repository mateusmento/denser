---
title: Presentational sync composable
impact: HIGH
description: >-
  Presentational calls sync / Query / mutation APIs.
tags: [presentational, sync, composable]
---

## Trigger

A **presentational** calls a **sync** composable, store, or Query/mutation API — fetch/cache/stale/refresh, invalidate, or optimistic update — instead of receiving data through props/`v-model`/events (or an **ambient port**).

Classify composables per [`references/presentational-container.md`](../references/presentational-container.md). Ambient ports (`useAuthUser`, `useCurrentWorkspace`) are allowed only when adapter-backed with no sync on the presentational path.

```ts
// ❌ Presentational pulls synchronized SoT
const { data: users, isFetching } = useWorkspaceMemberSearch(channelId)
```

## Rule

Move the sync call into a **container** (or sync composable used only by containers). Presentational takes a **view-model slice** / props + events / `v-model`; container maps sync → that surface. Add/update **Storybook** stories with fixtures only.

```vue
<!-- ✅ Presentational — controllable, no sync -->
<script setup lang="ts">
defineProps<{ list: PaginatedListView<IUser> }>()
defineEmits<{ search: [q: string]; loadMore: [] }>()
const selected = defineModel<string | null>('assigneeId')
</script>

<!-- ✅ Container — sync composable lives here -->
<script setup lang="ts">
const memberSearch = useWorkspaceMemberSearch(channelId)
const list = computed(() => toPaginatedListView({ … }))
</script>

<template>
  <IssueAssigneeMenu
    v-model:assignee-id="assigneeId"
    :list="list"
    @search="memberSearch.search"
    @load-more="memberSearch.loadMore"
  />
</template>
```

## When not

- **Ambient port** reads (adapter-backed identity) — allowed in presentational; Storybook supplies fixtures.
- **UI/local** composables (open state, virtualizer, non-network browser APIs).
- The SFC is already a **container** (misfiled under presentationals) — reclassify; don’t strip sync and leave chrome-less wiring broken.

## Leading word

**presentational sync composable**
