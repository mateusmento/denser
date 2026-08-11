---
title: Handmade interactivity
impact: MEDIUM
description: >-
  Raw DOM widget logic in a feature — use design-system or a library first;
  do not dump feature glue into design-system.
tags: [dom, design-system, vueuse, layering]
---

## Trigger

A presentational (or feature helper) implements **widget interactivity** with raw browser APIs — `addEventListener`, `contenteditable` / `execCommand`, custom overlay geometry, `classList` theme flips, hand-rolled toast timers — instead of an existing primitive or library.

Contract: [`references/folder-structure.md`](../references/folder-structure.md) (promotion), [`references/coding-style.md`](../references/coding-style.md) (VueUse for boring DOM). This rule is **where the widget lives**, not “prefer VueUse.”

```vue
<!-- ❌ Feature SFC invents a toast -->
<script setup>
function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 2200)
}
</script>
```

## Rule

Decision tree:

1. **Already in `@denser/design-system`?** Use it (`Popover`, `DropdownMenu`, `Toaster`, `MessageScroller`, …).
2. **Domain-agnostic chrome** a second surface will need? **Promote / add in design-system** — do not leave a one-off widget in the feature.
3. **Does not fit design-system** (Conversation TipTap composer, domain grouping, demo-only prototype glue)? Keep it in the **feature/module**, but still do not hand-roll: library (**TipTap** for rich text) or VueUse / a UI composable.

Do **not** promote feature-specific or library-shaped logic into design-system just to get it out of the feature. Design-system stays domain-agnostic.

## When not

- Ordinary Vue `@click` / `v-model` / CSS `:hover`.
- VueUse wrapping a DOM API the library already covers ([`coding-style.md`](../references/coding-style.md)).
- Throwaway HTML under `docs/ui-surfaces/` (not app code).
- Design-system itself wrapping Reka / browser APIs — that is its job.

## Leading word

**handmade interactivity**
