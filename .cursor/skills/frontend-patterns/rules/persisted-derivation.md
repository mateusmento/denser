---
title: Persisted derivation
impact: HIGH
description: >-
  Computed/projection stored as if canonical.
tags: [state, projection]
---

## Trigger

A value that **can be computed** from canonical state (or props/URL) is **persisted** or synced as if it were its own SoT — filters derived from URL+list, denormalized display strings stored beside entities, “selected count” stored instead of derived, cached projections written back as source data.

Contract: [`references/state-management.md`](../references/state-management.md) (**canonical** vs **projection**).

## Rule

**Persist / sync only canonical state. Derive everything else** (computed, memoized, view-model slice). If a projection must be cached for performance, treat it as a **cache**, not a second owner — invalidate or recompute when canonical inputs change; do not accept writes to the projection as authority.

## When not

- The value has an independent **owner** (user preference, URL param that *is* the SoT for “where the user is”).  
- Server returns a denormalized field that is **authoritative on the wire** and you only display it — still prefer deriving client-side when you already hold the canonical parts; don’t invent a parallel client store for it.  
- Expensive pure derivation memoized in memory for the session — fine; don’t write it to IndexedDB/Query as truth.

## Leading word

**persisted derivation**
