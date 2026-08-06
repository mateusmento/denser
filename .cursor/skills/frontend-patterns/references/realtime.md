---
title: Realtime
impact: HIGH
description: >-
  Transport vs apply, rooms, socket ingest into canonical DB, optimistic echo dedupe.
tags: [realtime, socket, ingest, subscribe]
---

# Realtime

Realtime is another **ingest path** into the **same canonical client replica** — not a third SoT. Ownership, canonical vs projection, optimistic vs invalidate: [`state-management.md`](state-management.md). Sync stack and sharing: [`composables.md`](composables.md). Who may call sync: [`presentational-container.md`](presentational-container.md).

Leading words: **ingest**, **canonical**, **subscribe**.

---

## Split: transport vs apply

| Concern | Owns |
| --- | --- |
| **Transport** | Connection, auth handshake, **rooms**, join/leave, reconnect resubscribe |
| **Apply** | Map server events → **sync composable commands** that write **TanStack DB** (and invalidate/refetch projections when needed) |

Do not apply socket payloads straight into presentational state, a parallel “socket store,” or ad-hoc Query key patches as the primary path when DB is the canonical replica.

---

## Subscribe (rooms)

Join rooms for **every live subscription the client owns**, not only the **visible** screen. Active-UI-only joins are simpler but break background / multi-query coherence.

Use a **personal user room** (or equivalent) for user-targeted events instead of fan-out onto every resource room.

Product-specific room names and membership rules live in app CONTEXT / ADRs — this skill states the principle.

On reconnect: **resubscribe** owned rooms; then rely on apply + existing Query/DB reconciliation (refetch or event replay per feature policy) — don’t assume the in-memory replica is complete after a drop.

---

## Wiring

Socket listeners and room join lifetime belong in a **`createSharedComposable`** (or equivalent mount-tied shared setup) used by **sync composables / containers** — not presentationals.

Teardown with the subscriber graph: leaving the authenticated app (or losing the shared composable’s last subscriber) leaves rooms and removes handlers.

---

## Optimistic HTTP + socket echo

- User commands still go through **HTTP (or documented command API)** with **optimistic DB** updates when appropriate ([`state-management.md`](state-management.md)).
- Socket events for the same fact must **dedupe** against optimistic rows (**nonce** / **client id** / server id replace).
- **Server remains authoritative** — honor version/conflict policy ([`conflict-version.md`](conflict-version.md)); sockets must not bypass concurrency rules or invent a second store.

---

## Boundary checklist

| Layer | Role |
| --- | --- |
| Transport composable | Socket client, rooms, reconnect |
| Sync composable | Commands that apply events to DB + projection policy |
| Container | Starts/stops shared realtime with feature lifecycle; maps queries to UI |
| Presentational | Renders projections only — no socket imports |

---

## Smells

Recognition aids for this contract — **not** separate `rules/` files unless the remedy is distinct (e.g. [`undeduped-echo`](../rules/undeduped-echo.md)). Cross-cutting: [`normalization-pressure`](../rules/normalization-pressure.md), [`duplicated-ownership`](../rules/duplicated-ownership.md).

| Smell | Meaning |
| --- | --- |
| Third SoT | Socket-only store beside DB/Query |
| Active-UI-only joins | Background live data goes stale by design |
| Presentational sockets | UI layer owns transport/apply |
| Undeduped echo | Optimistic row + socket/HTTP echo = duplicates — [`../rules/undeduped-echo.md`](../rules/undeduped-echo.md) |
| Query-key fan-out from sockets | Hand-patching every list key instead of canonical apply (see below) |

### Query-key fan-out from sockets

A socket handler updates live data by **manually patching many TanStack Query keys** (`['messages', channelA]`, `['messages', channelB]`, search keys, unread badges, …) — the same fan-out smell as HTTP mutations without a normalized store.

**Looks like:** missed a key → stale UI in one panel; sync code grows with every new list shape; socket handler knows the whole cache topology.

**Fix:** socket **apply** writes **canonical DB** (one entity upsert/delete); list/search windows are **projections** that read from DB or are invalidated/refetched as a policy — not N hand-written cache edits per event. Same as mutation coherence in [`state-management.md`](state-management.md); multi-key pain is [`normalization-pressure`](../rules/normalization-pressure.md).

---

## Related

| Topic | Where |
| --- | --- |
| Undeduped optimistic + socket echo | [`../rules/undeduped-echo.md`](../rules/undeduped-echo.md) |
| Normalize / multi-source updates | [`../rules/normalization-pressure.md`](../rules/normalization-pressure.md) |
| Async status UX | [`async-ux.md`](async-ux.md) |
| Duplicated ownership | [`../rules/duplicated-ownership.md`](../rules/duplicated-ownership.md) |
