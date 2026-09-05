# 02 — Messages API + realtime

**Chunk:** 1  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** ready-for-agent  
**Blocked by:** 01 — Scaffold  
**Branch:** `agent/messaging-02-messages-api`  
**Specs:** [interfaces.md](../interfaces.md) · [FRONTEND-ARCHITECTURE.md](../../../docs/FRONTEND-ARCHITECTURE.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Message **list/send/edit/delete** HTTP + socket events. Cursor paging (`next`/`prev`/`around`), `client_id` for optimism, ACL for regular vs direct conversations. **No timeline UI** — ticket **03** wires the app.

**Owns:** message handlers, repository, socket emit.

**Must not touch:** timeline composable (**03**), quote preview builder (**04**), BlobStore adapters (**16**), AttachmentReferences impl (**17**), drafts HTTP (**22**), scheduler (**24**).

**Consumes:** contracts + message table from **01**. `attachmentIds` on post accepted; refs sync may no-op until **17**.

## Updates (task pack v2)

- **Split from** archive **03** (list/send + window): this ticket is **API only**; virtualization lives in **03**.
- Renumbered: was the first half of old ticket 03.

## API (backend)

- [ ] `ListMessages`: size, cursor, direction `next`/`prev`/`around`
- [ ] `PostMessage`: non-empty body **or** `attachmentIds`; `clientId`; optional `quotesId`/`threadId`
- [ ] `EditMessage` / `DeleteMessage` (soft-delete)
- [ ] Socket `message.created` | `message.updated` | `message.deleted`
- [ ] ACL: regular = space; direct = member until **14** migrates peers
- [ ] Tests: list cursor + post happy path

## App (frontend)

_N/A_

## Comments

Quotes/threads columns may exist from scaffold — accept `quotesId`/`threadId` on write even if preview (**04**) / thread UI (**07**) not merged.

## PR

- [ ] `[messaging 02] Messages API + realtime` — [PR-POLICY.md](../PR-POLICY.md)
