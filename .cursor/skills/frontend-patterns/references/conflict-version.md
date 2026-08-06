---
title: Conflict / version
impact: HIGH
description: >-
  Whole-entity version, 409 merge-retry, same-field UX; optimistic must not skip the gate.
tags: [conflict, version, 409, concurrency]
---

# Conflict / version

Optimistic concurrency for synchronized entities. Ownership and mutation coherence: [`state-management.md`](state-management.md). Socket apply must honor the same gate: [`realtime.md`](realtime.md).

Leading words: **version**, **409**, **merge-retry**.

Denser default matches whole-entity versioning: monotonic `version`, PATCH carries client version, **409** + merge pending fields + retry. Adapt field-level or CRDT schemes only when product pressure demands — document the exception.

---

## Policy (default)

1. Entity carries a monotonic **`version`** (whole-entity token, not per-field for v1).  
2. Mutating requests **send the version** the client based the edit on.  
3. On success: server returns new version; sync composable writes **canonical DB** (confirm optimistic row).  
4. On **`409`**: response body includes the **current server snapshot** (including its version).  
5. Client **merges pending field changes** into that snapshot (non-overlapping fields keep both sides’ intent), sets version to the server’s, **retries** the PATCH.  
6. **Same-field** conflict (both changed the same field): do **not** silent last-write-wins — surface UX or require explicit overwrite.  
7. Optimistic UI **must not bypass** the version gate or invent a second store.

Apply path: sync composable command → **TanStack DB** (+ projection invalidate/refetch as usual). HTTP and sockets stay authoritative through that path.

---

## Merge-retry sketch

```text
pending = fields user intended to change
baseVersion = version at edit start

PATCH { ...pending, version: baseVersion }
  → 2xx: upsert DB with server entity (new version); clear pending
  → 409 + current:
       merged = { ...current, ...pending }  // pending wins only for keys user edited
       if same-field clash with concurrent edit: UX / overwrite choice — stop auto-retry
       else PATCH { ...mergedDiff, version: current.version }  // retry once or bounded
```

Bound retries; after exhaustion, surface error + user retry ([`async-ux.md`](async-ux.md)).

---

## With realtime

Socket patches may advance canonical `version` while an optimistic PATCH is in flight. Reconcile with the same rules: **nonce/client id** for create echoes ([`undeduped-echo`](../rules/undeduped-echo.md)); for updates, prefer server snapshot on 409 over inventing a third merge path. Sockets must not skip version checks on write commands.

---

## Smells (in-reference)

| Smell | Meaning |
| --- | --- |
| Ignore 409 | Drop fails or UI lies; concurrent edits corrupt silently |
| LWW without version | Last writer wins; demo/product multi-client story breaks |
| Optimistic skip version | PATCH without version / client overwrites SoT casually |
| Merge in the presentational | Conflict policy belongs in sync composable / api-client helper |

No separate rule file unless a distinct remedy appears beyond this contract.

---

## Related

| Topic | Where |
| --- | --- |
| Optimistic on DB | [`state-management.md`](state-management.md) |
| Realtime ingest | [`realtime.md`](realtime.md) |
| Undeduped create echo | [`../rules/undeduped-echo.md`](../rules/undeduped-echo.md) |
| Retry UX | [`async-ux.md`](async-ux.md) |
