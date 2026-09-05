# 10 — Typing + presence API

**Chunk:** 2  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** ready-for-agent  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-10-typing-presence-api`  
**Specs:** [conversation.md](../../../docs/ui-surfaces/conversation.md)


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

- [ ] `EmitTyping` + `typing` socket events with TTL prune
- [ ] `conversation.presence` — users viewing this conversation
- [ ] `workspace.presence` — online in root space

## App (frontend)

_N/A_

## Comments

Can start once **02** exposes conversation socket room membership.

## PR

- [ ] `[messaging 10] Typing + presence API` — [PR-POLICY.md](../PR-POLICY.md)
