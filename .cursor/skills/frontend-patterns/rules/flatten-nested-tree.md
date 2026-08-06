---
title: Flatten nested tree
impact: MEDIUM
description: >-
  Feature-nested trees; prefer flat slot composition.
tags: [slots, composition]
---

## Trigger

A component tree is **feature-nested**: middle layers mostly nest other feature components, and customization means editing the inner tree or forking the parent.

Also matches when components A (parent) and B (child):

- A has multiple code paths only to decide **which** child to render
- Child **B varies by use case** while shell **A stays the same**
- Call sites **duplicate A/B combinations** to get different children
- A is **tightly coupled** to one concrete child implementation
- Testing A requires **stubbing or replacing B** often
- A grows **layout flags** (`asModal`, `flush`, `dense`, …) only so different parents get different chrome around the same child region

## Rule

Decompose with **flat** composition: the shell exposes **slot** regions for feature/variable children. Parents (or wiring owners) fill those regions.

```vue
<!-- ❌ Feature-nested: shell hardcodes which feature child to render -->
<!-- Shell.vue -->
<template>
  <div class="shell">
    <header class="shell__chrome">…</header>
    <IssueSidebar v-if="mode === 'issue'" v-bind="issueProps" />
    <ChannelSidebar v-else v-bind="channelProps" />
  </div>
</template>

<!-- ✅ Flat: shell owns chrome; parent fills the variable region -->
<!-- Shell.vue -->
<template>
  <div class="shell">
    <header class="shell__chrome">…</header>
    <slot />
  </div>
</template>

<!-- Parent.vue -->
<template>
  <Shell>
    <IssueSidebar v-bind="issueProps" />
  </Shell>
</template>
```

Keep **simple/atomic** and design-system pieces **inside** the shell when they are true reuse — slots are for seams, not every child.

```vue
<!-- ✅ Atoms stay inside; only the feature region is a slot -->
<template>
  <div class="panel">
    <header class="panel__header">
      <Icon name="panel" />
      <h2>{{ title }}</h2>
      <Button variant="ghost" @click="$emit('close')">Close</Button>
    </header>
    <slot />
  </div>
</template>
```

**Slot regions:** prefer a **single default slot** when the parent owns the whole inner tree. Add a **named** slot only for a **unique UI section with a clear boundary**, and put the shell’s chrome **around** that slot — do not declare bare named slots with no surrounding structure.

```vue
<!-- ❌ Arbitrary named slots — no section boundary, parent must invent layout -->
<template>
  <div>
    <slot name="header" />
    <slot name="body" />
    <slot name="footer" />
  </div>
</template>

<!-- ✅ Parent owns the whole interior -->
<template>
  <div class="shell">
    <slot />
  </div>
</template>

<!-- ✅ Named slots only at real sections the shell structures -->
<template>
  <div class="shell">
    <slot name="header" />

    <div class="shell__body">
      <slot name="body"/>
    </div>

    <slot name="footer" />
  </div>
</template>
```

**Repeated fills:** **repeated identical slot fills across call sites (3+ clients)** → add a **wrapper** that fills those slots (thin composing component). Slots stay at the seam; the wrapper is the reusable composition so callers are not forced to reassemble the tree. The shell may also serve as a wrapper providing **default fills in its slots** to **ship with default composition wired by props** so most callers never reassemble the tree.

```vue
<!-- ❌ 3+ callers repeat the same fill -->
<template>
  <ChannelPane>
    <template #members>
      <ChannelMembers :members="members" @remove="onRemove">
        <template #add-member>
          <WorkspaceMemberDropdown … />
        </template>
      </ChannelMembers>
    </template>
  </ChannelPane>
</template>

<!-- ✅ Wrapper owns the repeated composition; callers use the wrapper -->
<!-- containers/…/ChannelPaneWithMembers.vue (wrapper) -->
<template>
  <ChannelPane>
    <template #members>
      <ChannelMembers :members="members" @remove="onRemove">
        <template #add-member>
          <WorkspaceMemberDropdown … />
        </template>
      </ChannelMembers>
    </template>
  </ChannelPane>
</template>

<!-- Caller.vue -->
<template>
  <ChannelPaneWithMembers :members="members" @remove="onRemove" … />
</template>
```

## When not

- Variation is **data on a fixed tree** (fields/flags the shell already renders) → props or a view-model slice, not a slot.
- The nested child is part of the shell’s **stable contract** (compound component / controlled widget), not feature content.
- Slot fills are not yet repeated across 3+ clients — introduce the slot seam when the triggers above fire; add the wrapper only once fills repeat.

## Leading word

**flat composition**
