---
title: Composable multiple reasons
impact: MEDIUM
description: >-
  One useX packs multiple reasons to change.
tags: [composable, srp]
---

## Trigger

One `useX` (or shared/global factory) packs **multiple reasons to change** — unrelated features, mixed domains, or a grab-bag of unrelated queries/commands that would churn for different product reasons.

Violates: cohesive feature boundary / **one reason to change** — [`references/composables.md`](../references/composables.md).

```ts
// ❌ Multiple reasons to change
export function useWorkspaceEverything() {
  // issues sync + chat sync + theme UI + billing
}
```

## Rule

Split into composables along **feature / reason-to-change** boundaries. Compose them from a container (or a thin orchestrating composable that only wires those peers — still one orchestration reason).

Prefer vertical slices: `useIssueSearch`, `useChannelMessages`, `useThemePreference` — not `useAppState`.

## When not

- One domain capability with several related queries/commands (e.g. `useIssue` load + update + labels on **that** issue) — still one reason if they change together.
- `createSharedComposable` wrapping a **single** cohesive composable for lifetime — sharing ≠ merging features.

## Leading word

**composable multiple reasons**
