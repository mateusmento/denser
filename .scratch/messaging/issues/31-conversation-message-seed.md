# 31 — Conversation message seed data

**Chunk:** — (dev experience)  
**Layer:** api  
**Domain:** [CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)  
**Status:** resolved  
**Blocked by:** 02 — Messages API; wave-3 app tickets merged (#17–#21)  
**Branch:** _unclaimed_  
**Specs:** [CHUNKS.md](../CHUNKS.md)

## What to build

Seed realistic **conversation messages** so local dev and demos showcase messaging features without manual sends.

**Folder:** `packages/api/src/db/seed/conversations/` (reserved — add one module per scenario).

**Must include:**

- [x] **Jump to quote — in window:** quote on a message still inside the default timeline window; click recenters + scrolls.
- [x] **Jump to quote — out of window:** quote targets a message far enough back that `around` fetch is required; verifies around-focus + jump-to-latest chrome.
- [x] Thread parent + a few replies (engineering channel).
- [x] Optional: edited message, deleted tombstone.

**Owns:** seed modules + wiring from `packages/api/src/db/seed.ts` into message insert path.

**Must not touch:** message API contracts; app UI.

## Split guidance

Keep `seed.ts` orchestration thin. Each scenario file exports a `SeedConversationMessagesModule` from `seed/conversations/types.ts` and registers in `seed/conversations/index.ts`.

Target &lt;300 lines per module; split by channel or feature area when a file grows.

## API (backend)

- [x] `seedConversationMessages(db, modules)` helper (idempotent upsert by stable message id)
- [x] Register modules in `conversationMessageSeedModules`

## App (frontend)

_N/A_
