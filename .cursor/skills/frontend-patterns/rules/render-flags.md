---
title: Render flags
impact: MEDIUM
description: >-
  Flags/enums only to pick child trees — use slots.
tags: [slots, props]
---

## Trigger

A shell grows **render flags** (or mode enums) whose only job is to pick **which child tree** to render or whether a region exists:

- `showFooter`, `showHeader`, `withActions`
- `headerVariant`, `mode="issue" | "channel"`
- `empty` / `loading` flags that swap entire inner trees the shell does not own

Also matches when adding a use case means a new boolean/enum on A instead of composing a different child.

## Rule

Replace those flags with **slot** regions at the unique UI sections. Callers compose the tree they need; the shell keeps chrome and structure it owns.

Follow slot-region shape in [`flatten-nested-tree`](flatten-nested-tree.md): prefer a default slot; named slots only with shell chrome around a clear boundary.

```vue
<!-- ❌ Render flags — shell picks alternate trees -->
<script setup>
defineProps<{
  showFooter?: boolean
  headerVariant?: 'user' | 'channel' | 'none'
  mode: 'issue' | 'channel'
}>()
</script>

<template>
  <div class="shell">
    <UserHeader v-if="headerVariant === 'user'" … />
    <ChannelHeader v-else-if="headerVariant === 'channel'" … />

    <IssueBody v-if="mode === 'issue'" … />
    <ChannelBody v-else … />

    <footer v-if="showFooter">
      <DefaultFooter … />
    </footer>
  </div>
</template>

<!-- ✅ Slots at the variable regions -->
<template>
  <div class="shell">
    <div class="shell__header">
      <slot name="header" />
    </div>

    <slot />

    <div class="shell__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<!-- Caller.vue -->
<template>
  <Shell>
    <template #header>
      <UserHeader … />
    </template>
    <IssueBody … />
    <template #footer>
      <DefaultFooter … />
    </template>
  </Shell>
</template>
```

## When not

- Flags change **the shell’s own** chrome or behavior it renders (`disabled`, `dense`, `open`) — keep as props.
- Variation is **data on a fixed tree** the shell already renders → props or a view-model slice.
- A single optional region with a **stable default** child → wrapper / defaulted composition in [`flatten-nested-tree`](flatten-nested-tree.md), not a forest of mode flags.

```vue
<!-- ✅ Shell-owned flag — affects its own chrome, not which feature tree -->
<template>
  <div class="shell" :class="{ 'shell--dense': dense }">
    <slot />
  </div>
</template>
```

## Leading word

**render flags**
