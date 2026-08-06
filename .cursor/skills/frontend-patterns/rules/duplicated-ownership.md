---
title: Duplicated ownership
impact: HIGH
description: >-
  Two authoritative replicas of the same fact.
tags: [state, ownership]
---

## Trigger

The **same fact** (same SoT field / same entity identity) has **two or more writers or independent replicas** that claim authority — e.g. issue title in a hand-kept Pinia-like bag **and** in Query cache **and** copied into component state, each updated on different paths.

Distinct from “many **projections** of one canonical replica” (allowed). This is **duplicated ownership**.

Contract: [`references/state-management.md`](../references/state-management.md) (**ownership**, **canonical**).

## Rule

Pick **one owner** for the canonical value. All other surfaces **read** (projection, view-model, display) or go through that owner’s **commands**. For synchronized domain entities, canonical client replica is **TanStack DB** (when normalize applies) fed by Query/network — not a second ad-hoc entity map.

If copies exist only because of query-key fan-out, prefer [`normalization-pressure`](normalization-pressure.md).

## When not

- Intentional **optimistic** copy that reconciles to the single owner (temporary; owner remains clear).  
- **Ambient port** fixture vs app adapter — same port, different adapters, not two SoTs in production.  
- Server denormalized embeds in a DTO used only for one response mapping into canonical DB — one write path into canonical.

## Leading word

**duplicated ownership**
