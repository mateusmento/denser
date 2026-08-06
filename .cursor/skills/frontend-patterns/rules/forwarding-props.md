---
title: Forwarding props
impact: MEDIUM
description: >-
  Forwards unused props/events (pass-through / drill) — use slots.
tags: [slots, props]
---

## Trigger

A component **forwards props/events it does not use** — it does not read them to decide its own behavior or markup.

- **One hop** → what people call pass-through  
- **Many hops** → what people call props-drilling  

Same smell; depth is severity, not a different rule. **Lifting state too high** often creates this pipe (owner sits above shells that only forward); still the same trigger — fix with a slot, not by keeping the drill.

Also matches when:

- Adding wiring forces new props/events through one or more layers that only forward them
- **Event re-emission chains** — middle layers only `@foo="$emit('foo')"` (or rename) without using the event
- **Giant prop bags as drill fuel** — a wide bag (often 8+ fields, or a flat store dump) is piped through layers that do not render those fields, only so a deep leaf can. If the component **does** render that dump, see [`giant-prop-bags`](giant-prop-bags.md) instead (view-model slice).

```vue
<!-- ❌ Event re-emission chain — intermediaries never handle the event -->
<!-- Pane.vue -->
<template>
  <Members :members="members" @remove="(id) => $emit('remove', id)" />
</template>

<!-- Members.vue -->
<template>
  <MemberRow v-for="m in members" :key="m.id" @remove="(id) => $emit('remove', id)" />
</template>

<!-- ❌ Giant prop bag as drill fuel — Pane does not render search/fetch fields -->
<!-- Pane.vue -->
<template>
  <Members
    :members="members"
    :search-users="searchUsers"
    :search-loading="searchLoading"
    :search-has-more="searchHasMore"
    :on-search="onSearch"
    :on-load-more="onLoadMore"
    @remove="onRemove"
  />
</template>
```

## Rule

Open a **slot** at the lowest shell that owns the surrounding layout. Compose the real consumer next to the data/wiring owner so intermediaries stop being pipes. **Repeated identical fills** → wrapper ([`flatten-nested-tree`](flatten-nested-tree.md)).

Do **not** use provide/inject to paper over forwarding — that hides the pipe; slots and wrappers remove it.

```vue
<!-- ❌ Forwarding props (one hop = pass-through; more hops = props-drilling) -->
<!-- App.vue -->
<template>
  <Card :user="user" :on-save="save" />
</template>

<!-- Card.vue — does not use user / onSave -->
<template>
  <div class="card">
    <Header :user="user" :on-save="onSave" />
  </div>
</template>

<!-- Header.vue — does not use user / onSave -->
<template>
  <header class="card__header">
    <UserBadge :user="user" @save="onSave" />
  </header>
</template>

<!-- ✅ Slot at the layout shell; compose the consumer where the data lives -->
<!-- Card.vue -->
<template>
  <div class="card">
    <header class="card__header">
      <slot name="header" />
    </header>
    <slot />
  </div>
</template>

<!-- App.vue -->
<template>
  <Card>
    <template #header>
      <UserBadge :user="user" @save="save" />
    </template>
  </Card>
</template>
```

## When not

- Every hop on the path **genuinely consumes** the value (behavior or markup depends on it).

```vue
<!-- ✅ Not forwarding — Card reads user for its own markup -->
<template>
  <div class="card">
    <h2>{{ user.name }}</h2>
    <slot />
  </div>
</template>
```

- Many **unrelated** descendants in **different branches** need the same value (theme, current user, …) → provide/inject or app/feature store — a **different** problem, not a substitute for fixing forwarding with slots. Who may read **synchronized** or **ambient** state is the presentational/container contract: [`references/presentational-container.md`](../references/presentational-container.md). Presentational must not call **sync** composables to “avoid” props ([`presentational-sync-composable`](presentational-sync-composable.md)).

- **Transparent attrs wrapper** — thin shell whose job is `$attrs` / `class` / `disabled` fallthrough onto a **fixed** leaf (design-system `Button` → native). Intentional facade, not domain drill.

```vue
<!-- ✅ Transparent wrapper — attrs fall through to the leaf -->
<script setup>
defineOptions({ inheritAttrs: false })
</script>

<template>
  <button class="ds-button" v-bind="$attrs">
    <slot />
  </button>
</template>
```

- **Facade over a fixed child** — the component’s public identity *is* that child (`UserAvatar` always renders the same avatar leaf). Forwarding or remapping leaf props (`src`, `alt`, `size` → classes) is the API; a slot would force every caller to rebuild the same leaf.

```vue
<!-- ✅ Facade — fixed child; props are the leaf’s public surface -->
<template>
  <img
    class="user-avatar"
    :class="sizeClass"
    :src="src"
    :alt="alt"
  />
</template>
```

- The shell **does** render the bag’s fields → [`giant-prop-bags`](giant-prop-bags.md) (**view-model slice**). Slot only the regions that stay wired feature trees (see [`presentational-container-seam`](presentational-container-seam.md)).

Shells that **ship a default child wired by props** (and only slot for rare overrides) are the **wrapper / defaulted composition** pattern in [`flatten-nested-tree`](flatten-nested-tree.md) — not an escape hatch here.

## Leading word

**forwarding props**
