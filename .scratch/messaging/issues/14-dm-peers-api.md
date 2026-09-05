# 14 — DM peers + hide preference API

**Chunk:** 2  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md) · [ARTIFACTS-AND-SPACES.md](../../../docs/ARTIFACTS-AND-SPACES.md)  
**Status:** resolved  
**Blocked by:** 02 — Messages API  
**Branch:** `agent/messaging-14-dm-peers-api`  
**Specs:** [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Migrate DM identity from `conversation_member` to **`conversation_peer`**: expand (new table + dual-read), backfill, switch ACL, contract (drop old). Sidebar **hide** preference. No “leave DM” — hide-only.

**Owns:** schema expand–contract; ACL helpers for direct; `OpenOrCreateDirectConversation` dedupe by peer set.

**Must not touch:** message body/list beyond ACL; shell UI (**15**); attachments.

**Consumes:** `conversation_peer` stub from **01** scaffold.

## Updates (task pack v2)

- **Renumbered** from archive **13** (conversation peers). Shell UI split to **15**.

## API (backend)

- [x] Expand: `conversation_peer` (+ optional `dm_sidebar_preference`) beside `conversation_member`
- [x] Backfill peers from members for directs
- [x] Access checks use peer ∩ workspace
- [x] Dedupe key `(root_space_id, sort(peer ids))` unchanged in spirit
- [x] Contract: remove `conversation_member` for directs (or whole table if unused)
- [x] `HideDirectConversation` / `UnhideDirectConversation`
- [x] Wide refactor — expand/migrate/contract may span commits; note in PR body

## App (frontend)

_N/A_

## Comments

Keep CI green via expand–contract; integration branch OK if needed.

## PR

- [x] `[messaging 14] DM peers + hide preference API` — [PR-POLICY.md](../PR-POLICY.md)
