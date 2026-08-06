---
title: Presentational/container seam
impact: HIGH
description: >-
  Presentational must render wired region — use a slot.
tags: [slots, presentational, container]
---

## Trigger

A **presentational** component must render a **container** (or other wired feature tree): it imports a container, hardcodes wired children, or grows props only so it can configure that wiring.

Layer labels optional — same smell if a “dumb” shell depends on fetch/mutate/store wiring to render a region.

Layer contract: [`references/presentational-container.md`](../references/presentational-container.md). Import itself is also [`presentational-imports-container`](presentational-imports-container.md); this rule is the **slot** remedy.

## Rule

Introduce a **slot** on the presentational at the region that needed the container. The **container** (or a composing parent) fills the slot with the wired tree.

Presentational keeps layout, a11y, and UI-local state; it does not own how the wired child works.

```vue
<!-- ❌ Presentational imports / hardcodes a container -->
<!-- presentationals/ChannelDetailsPane.vue -->
<script setup>
import WorkspaceMemberDropdown from '@/containers/…/WorkspaceMemberDropdown.vue'
</script>

<template>
  <div class="pane">
    <section class="pane__members">
      <h3>Members</h3>
      <MemberList :members="members" @remove="…" />
      <WorkspaceMemberDropdown :channel-id="channelId" … />
    </section>
  </div>
</template>

<!-- ✅ Slot at the wired region; container fills it -->
<!-- presentationals/ChannelDetailsPane.vue -->
<template>
  <div class="pane">
    <section class="pane__members">
      <h3>Members</h3>
      <MemberList :members="members" @remove="…" />
      <slot name="add-member" />
    </section>
  </div>
</template>

<!-- containers/ChannelDetailsPane.vue -->
<script setup>
import ChannelDetailsPane from '@/presentationals/…/ChannelDetailsPane.vue'
import WorkspaceMemberDropdown from '@/containers/…/WorkspaceMemberDropdown.vue'
</script>

<template>
  <ChannelDetailsPane :members="members" @remove="…">
    <template #add-member>
      <WorkspaceMemberDropdown :channel-id="channelId" … />
    </template>
  </ChannelDetailsPane>
</template>
```

**Repeated identical slot fills across call sites (3+ clients)** → put that fill in a **wrapper** (see [`flatten-nested-tree`](flatten-nested-tree.md)) — do not pull the container back into the presentational to “help” reuse.

## When not

- **Atomic / design-system** children the presentational truly reuses (`Button`, `Input`, icons) — render them inside; do not slot every leaf.
- The child is part of the presentational’s **own contract** (compound API, controlled internals), not a container/feature subsystem.
- The shell **does** need the values to render that section itself → props or a view-model slice, not a slot that only forwards wiring.

```vue
<!-- ✅ Atoms stay inside the presentational -->
<template>
  <div class="pane">
    <header>
      <Icon name="channel" />
      <h2>{{ title }}</h2>
      <Button @click="$emit('close')">Close</Button>
    </header>
    <slot name="add-member" />
  </div>
</template>
```

## Leading word

**presentational–container seam**

See also: [`presentational-imports-container`](presentational-imports-container.md) (layer smell), [`references/presentational-container.md`](../references/presentational-container.md) (contract).
