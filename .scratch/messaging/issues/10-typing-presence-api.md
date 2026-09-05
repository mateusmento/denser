# 10 — Typing + presence API

**Chunk:** 2  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** claimed  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-10-typing-presence-api`  
**Specs:** [REALTIME-SCALING.md](../REALTIME-SCALING.md) · [conversation.md](../../../docs/ui-surfaces/conversation.md)

> **Scale note:** PR uses in-memory `Map`s — OK for single-node dev. Before multi-instance deploy, land ticket **30** ([REALTIME-SCALING.md](../REALTIME-SCALING.md)).


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Socket handlers for **typing** (TTL) and **presence** (conversation viewers + workspace online). No UI — **11** wires chrome.

**Owns:** typing/presence socket handlers + server-side TTL prune.

**Must not touch:** message list SQL; attachments; scheduler; UI (**11**).

**Consumes:** stable conversation room join from **02** sockets.

## Updates (task pack v2)

- **Split from** archive **10** (typing + presence): API half. Renumbered archive 10 → **10** api + **11** app.

## API (backend)

- [x] `EmitTyping` + `typing` socket events with TTL prune
- [x] `conversation.presence` — users viewing this conversation
- [x] `workspace.presence` — online in root space

## App (frontend)

_N/A_

## Comments

Can start once **02** exposes conversation socket room membership.

## PR

- [x] `[messaging 10] Typing + presence API` — https://github.com/mateusmento/denser/pull/14 (open, awaiting maintainer review)
