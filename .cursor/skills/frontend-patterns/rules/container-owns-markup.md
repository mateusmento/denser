---
title: Container owns markup
impact: HIGH
description: >-
  Container owns layout chrome or styling instead of composing presentationals.
tags: [container, presentational, chrome]
---

## Trigger

A **container** introduces **layout chrome**, **styling/classes**, or **raw visual structure** (`div`/`section` with classes, Tailwind, decorative markup) instead of only composing presentational / design-system roots and slots.

Contract: [`references/presentational-container.md`](../references/presentational-container.md).

```vue
<!-- ❌ Container owns markup -->
<template>
  <div class="flex flex-col gap-4 p-4">
    <h2 class="text-lg">Members</h2>
    <MemberList :members="members" />
  </div>
</template>
```

## Rule

Move chrome into a **presentational**. Container template only mounts presentational/design-system roots, fills slots, and wires props/events/`v-model`.

```vue
<!-- ✅ Presentational owns chrome -->
<!-- presentationals/MembersPanel.vue -->
<template>
  <div class="flex flex-col gap-4 p-4">
    <h2 class="text-lg">Members</h2>
    <slot />
  </div>
</template>

<!-- ✅ Container — composition only -->
<template>
  <MembersPanel>
    <MemberList :members="members" @remove="…" />
    <WorkspaceMemberDropdown … />
  </MembersPanel>
</template>
```

Prefer extending an existing presentational over inventing an empty shell for a single `div` when that chrome already belongs to a parent presentational’s slot region.

## When not

- Root is a **presentational** or **design-system** component (no extra chrome in the container).
- Multiple roots / fragments with **no** classes or layout structure — composition only.
- The SFC is actually a **presentational** misfiled as a container — reclassify; keep the markup.

## Leading word

**container owns markup**
