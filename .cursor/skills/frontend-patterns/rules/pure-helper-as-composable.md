---
title: Pure helper as composable
impact: LOW
description: >-
  Pure helper named useX — put in lib/ instead.
tags: [composable, lib]
---

## Trigger

A `useX` (or “composable”) is only a **pure non-reactive helper** — no reactive state, no hooks, no queries/commands over state — just formatting, mapping, or plain functions prefixed with `use`.

Violates: composables encapsulate state/behavior/hooks — pure helpers are not composables — [`references/composables.md`](../references/composables.md).

```ts
// ❌
export function useIssueLabel(issue: Issue) {
  return issue.status === 'done' ? 'Done' : 'Open'
}
```

## Rule

Move to **`lib/`** (or feature pure utils) as a plain function (`formatIssueLabel`, `toPaginatedListView`). Reserve `use*` for reactive/hook encapsulation.

## When not

- Function uses Vue reactivity, lifecycle, or injected context meaningfully.
- Thin wrapper that **must** be a composable to call other composables/hooks (still expose a real query/command or reactive surface).

## Leading word

**pure helper as composable**
