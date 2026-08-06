---
title: Ad-hoc domain types
impact: MEDIUM
description: >-
  Hand-written wire/domain types that drift from Zod/contracts.
tags: [types, contracts, zod]
---

## Trigger

Feature or sync code introduces **hand-written domain/wire types** (or duplicate interfaces) that **drift from Zod** — especially API/backend-shared vocabulary that belongs in **`contracts`**, or parallel types beside an existing schema.

Contract: [`references/composables.md`](../references/composables.md).

```ts
// ❌ Ad-hoc wire type beside / instead of contracts Zod
export interface Issue {
  id: string
  title: string
  status: string
}
```

## Rule

- API/backend-shared vocabulary → Zod in **`contracts`** + `z.infer` (and TanStack DB collections aligned to those schemas).
- Frontend-only shapes → feature-module Zod/types — **not** `contracts`.
- Composables **import** schemas/types; do not redefine competing interfaces.

```ts
// ✅
import { issueSchema, type Issue } from '@denser/contracts' // z.infer<typeof issueSchema>
```

## When not

- True **view-model slices** for presentational props ([`GLOSSARY.md`](../GLOSSARY.md)) — derived for UI sections, not a second wire SoT.
- One-off local types with **no** schema twin and **no** wire/DB role (narrow callback args) — keep local; promote when shared or persisted.

## Leading word

**ad-hoc domain types**
