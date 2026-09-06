# 30 — Realtime ephemeral ports + horizontal scale

**Chunk:** infra (cross-cutting)  
**Layer:** api  
**Domain:** [REALTIME-SCALING.md](../REALTIME-SCALING.md)  
**Status:** claimed  
**PR:** [#26](https://github.com/mateusmento/denser/pull/26) (open — mergeable)  
**Blocked by:** **10** merged (or rebase onto #14 branch before merge)  
**Branch:** `agent/messaging-30-realtime-scaling-ports`  
**Specs:** [REALTIME-SCALING.md](../REALTIME-SCALING.md) · [interfaces.md](../interfaces.md)

## What to build

Replace process-local typing/presence `Map`s (PR **#14**) with **ports + adapters** so multiple API instances share ephemeral state. Wire **Socket.IO Redis adapter** for cross-node room fan-out. **WebSocket-only** transport (no polling, no sticky sessions).

**Owns:** `TypingStore`, `PresenceStore` ports; in-memory + Redis adapters; `attach.ts` adapter wiring; api-client `transports: ["websocket"]`.

**Must not touch:** message SQL; AttachmentReferences; scheduling claim SQL (already DB-safe).

## Updates

- **Follow-up to ticket 10** — audit in [REALTIME-SCALING.md](../REALTIME-SCALING.md). Block multi-instance deploy until this lands.

## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Ports at clean seams; handlers stay thin; adapters own Redis/DO SDK details.

## API (backend)

### Phase A — ports + in-memory

- [ ] Add `TypingStore` + `PresenceStore` to `@denser/contracts` and [interfaces.md](../interfaces.md)
- [ ] Register in `PortMap`; `InMemory*` adapters (extract current `typing-state` / `presence-registry` logic)
- [ ] Refactor `realtime/handlers.ts` to use `getPort("typingStore")` / `getPort("presenceStore")` with `socketId` ref-counting
- [ ] Remove `createPresenceRuntime()` singleton from `attach.ts`
- [ ] Existing `presence.test.ts` passes against in-memory adapters

### Phase B — Redis + Socket.IO

- [ ] `RedisTypingStore` / `RedisPresenceStore` (or unified `RedisEphemeralStore`) behind `EPHEMERAL_STORE_ADAPTER=redis`
- [ ] `@socket.io/redis-adapter` when `REALTIME_ADAPTER=redis` (`REDIS_URL`)
- [ ] Server `transports: ["websocket"]` only
- [ ] Document env vars in `.env.example`
- [ ] Optional: docker-compose Redis integration smoke test (two processes)

## App (frontend)

- [ ] `packages/api-client/src/socket.ts` — `transports: ["websocket"]` only

## Out of scope (ticket 31)

- `UploadSessionStore` for `S3BlobStore.uploads` Map
- Cloudflare Durable Object adapters (document hook points only)

## PR

- [x] `[messaging 30] Realtime ephemeral ports + Redis scale` — [#26](https://github.com/mateusmento/denser/pull/26)
