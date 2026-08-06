---
title: Undeduped echo
impact: HIGH
description: >-
  Optimistic row + socket/HTTP echo become duplicates — use nonce/client id.
tags: [realtime, optimistic, dedupe]
---

## Trigger

An **optimistic** local row (temp id) and the later **server echo** — socket event and/or HTTP success — are applied as **separate** entities. No shared **nonce** / **client id** (or equivalent) reconciles them into one canonical row.

**Looks like:** duplicate messages/issues in the window; temp row left beside the server row; flicker then double.

Common with realtime: `message.created` (or entity created) arrives after an optimistic insert from the same user action.

Contract: [`references/realtime.md`](../references/realtime.md) (Optimistic HTTP + socket echo), [`references/state-management.md`](../references/state-management.md) (optimistic on DB).

## Rule

Give the in-flight command a stable **client identity** (**nonce** / **client id**) on:

1. the optimistic DB row  
2. the HTTP payload (when the API supports it)  
3. the socket echo (server echoes it back) **or** replace temp id with server id in a **single** apply path  

Socket apply and HTTP success must **upsert/reconcile** into one canonical row — never blind-append when a matching nonce/temp id exists.

## When not

- **Other users’** events — no local optimistic row; apply as a normal ingest.  
- Pessimistic command (no optimistic row) — only server id matters.  
- Dedupe already handled inside one sync command used by both HTTP success and socket apply.

## Leading word

**undeduped echo**
