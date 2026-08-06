---
title: Presentational imports container
impact: HIGH
description: >-
  Presentational imports a container or sync-owning tree.
tags: [presentational, container, layer]
---

## Trigger

A **presentational** **imports** a **container** (or hardcodes a wired feature tree that owns sync) so it can render that subtree.

Layer labels optional — same smell if a markup shell depends on a sync-owning child by import.

Overlaps the **slot** fix in [`presentational-container-seam`](presentational-container-seam.md); this rule is the **layer** smell. Contract: [`references/presentational-container.md`](../references/presentational-container.md).

```ts
// ❌
import WorkspaceMemberDropdown from '@/containers/…/WorkspaceMemberDropdown.vue'
```

## Rule

Remove the container import from the presentational. Open a **slot** at that region; a **container** (or composing parent) fills it. See [`presentational-container-seam`](presentational-container-seam.md) for slot shape and snippets.

Do not “fix” the import by inlining the container’s sync into the presentational — that becomes [`presentational-sync-composable`](presentational-sync-composable.md).

## When not

- Import is **design-system** or another **presentational** (including compounds).
- Import is `import type` only from domain/contracts — types do not make a container.
- Child is part of the presentational’s **stable compound contract**, not a sync-owning feature subtree.

## Leading word

**presentational imports container**
