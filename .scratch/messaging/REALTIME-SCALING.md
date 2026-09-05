# Realtime & ephemeral state — horizontal scaling audit

**Status:** Architecture plan (post PR #10 / #14 presence)  
**Related:** [interfaces.md](./interfaces.md) · [MEETINGS.md](../../docs/MEETINGS.md) (future LiveKit) · ticket **30**

---

## Problem

Several backend paths hold **process-local** ephemeral state. With **multiple API instances** (or **Cloudflare Workers**, which are stateless/ephemeral), that state is not shared:

- User A connects to **server 1**; user B on **server 2** never sees typing/presence.
- `io.to(room).emit(...)` on server 1 does not reach sockets on server 2 without a **Socket.IO adapter**.
- Multipart upload **part 2** on a different node than **part 1** loses the in-memory upload session.

**Policy (locked):**

- **WebSocket only** for Socket.IO clients — no long-polling fallback (no sticky sessions required).
- Ephemeral coordination via **ports + adapters**: in-memory (dev/test), **Redis** (Node multi-instance), **Durable Objects** (Cloudflare deployment option).
- Socket.IO uses **`@socket.io/redis-adapter`** (or compatible) when `REALTIME_ADAPTER=redis`.

---

## Inventory — in-memory state in `packages/api`

| Location | What is stored | Scale risk | Severity |
| --- | --- | --- | --- |
| **`realtime/typing-state.ts`** (PR #14) | `Map<conversationId, Map<userId, untilMs>>` | Typing only visible within one process | **P0** |
| **`realtime/presence-registry.ts`** (PR #14) | Ref-counted viewers per conversation + online per workspace | Wrong viewer lists / green dots per instance | **P0** |
| **`realtime/handlers.ts`** `createPresenceRuntime()` | Single runtime per process; `setInterval` prune | Same as above | **P0** |
| **`realtime/emit.ts`** | `let server: DenserServer \| null` | Emit from HTTP handler only reaches **local** sockets without adapter | **P0** |
| **Socket.IO rooms** (`conversation:*`, `workspace:*`, `user:*`) | Room membership in process memory | Cross-node fan-out broken without Redis adapter | **P0** |
| **`realtime/attach.ts`** (PR #15) | `conversation:watch` join/leave | Same — room membership local | **P0** (fixed by adapter) |
| **`domains/attachments/s3-blob-store.ts`** | `uploads = new Map<uploadId, ActiveUpload>` | Multipart upload breaks across instances | **P1** |
| **`domains/scheduling/service.ts`** | `setInterval` dispatcher per process | **OK** — `claimDueJobs` uses Postgres `SKIP LOCKED`; duplicate ticks are safe |
| **`domains/scheduling/service.ts`** | `handlers` map | **OK** — registration table, not shared runtime state |
| **`ports/container.ts`** | DI registry | **OK** — immutable after boot |
| **`ports/index.ts`** | `registered` flag | **OK** |
| Request-scoped `Map` in repos | Per-query aggregation | **OK** — not shared across requests |

**Not in API (but blocks “websocket only”):**

| Location | Issue |
| --- | --- |
| **`packages/api-client/src/socket.ts`** | `transports: ["polling", "websocket"]` — must be **`["websocket"]`** only |

---

## PR #14 (`agent/messaging-10-typing-presence-api`) — specific gaps

The presence PR correctly separates **handlers** (thin) from **typing-state** / **presence-registry** (deep modules), but both modules are **in-memory only** and instantiated once in `attach.ts`:

```ts
const presenceRuntime = createPresenceRuntime(); // one per Node process
```

**`conversationViewers.list(conversationId)`** is the source of truth for `conversation.presence` payloads — it must come from a **shared store**, not a local `Map`.

**Socket-local state is fine** (`socket.data.subscribedConversations`, `viewingConversations`) — it tracks *this connection’s* subscriptions. **Shared** state is ref-counts and typing TTLs.

---

## Target architecture

### 1. Ports (`@denser/contracts` + `packages/api/src/ports/`)

Add to `PortMap`:

```ts
/** Ephemeral typing indicators — TTL rows, not durable. */
type TypingStore = {
  pulse(input: { conversationId; userId; ttlMs }): Promise<{ until: string }>
  listActive(conversationId): Promise<{ userId; until: string }[]>
  // optional: prune is adapter-internal (Redis TTL / DO alarm)
}

/** Conversation viewers + workspace online — ref-counted per user within a scope. */
type PresenceStore = {
  joinConversation(input: { conversationId; userId; socketId }): Promise<{ viewers: UserId[]; becameViewer: boolean }>
  leaveConversation(input: { conversationId; userId; socketId }): Promise<{ viewers: UserId[]; becameAbsent: boolean }>
  listConversationViewers(conversationId): Promise<UserId[]>

  pulseWorkspace(input: { rootSpaceId; userId; socketId }): Promise<{ becameOnline: boolean }>
  leaveWorkspace(input: { rootSpaceId; userId; socketId }): Promise<{ becameOffline: boolean }>
}

/** Multipart upload session metadata (ticket 16/18) — optional second phase. */
type UploadSessionStore = {
  get(uploadId): Promise<ActiveUpload | null>
  set(uploadId, session): Promise<void>
  delete(uploadId): Promise<void>
}
```

Use **`socketId`** (Socket.IO id) in presence ref-counting so multi-tab on the **same** server still works; store is responsible for per-user aggregation.

### 2. Adapters

| Adapter | When | Notes |
| --- | --- | --- |
| **`InMemoryTypingStore` / `InMemoryPresenceStore`** | dev, unit tests | Current behaviour; single process |
| **`RedisTypingStore` / `RedisPresenceStore`** | Node, multiple replicas | Keys with TTL; `HINCRBY` / sorted sets for ref-count; pub/sub optional (Socket adapter handles fan-out) |
| **`DurableObjectTypingStore` / `DurableObjectPresenceStore`** | Cloudflare | One DO per `conversationId` or shard; HTTP/RPC from Worker or Node bridge |
| **`RedisUploadSessionStore`** | multi-instance uploads | JSON blob per `uploadId`, TTL ~1h |

Env selection (mirror BlobStore pattern):

```text
EPHEMERAL_STORE_ADAPTER=memory|redis|durable-object
REALTIME_ADAPTER=local|redis          # Socket.IO only
REDIS_URL=...
```

### 3. Socket.IO horizontal scale

**Server (`attach.ts`):**

```ts
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const io = new SocketServer(httpServer, {
  cors: { origin: appOrigin, credentials: true },
  transports: ["websocket"], // no polling
});

if (process.env.REALTIME_ADAPTER === "redis") {
  const pub = createClient({ url: process.env.REDIS_URL });
  const sub = pub.duplicate();
  await Promise.all([pub.connect(), sub.connect()]);
  io.adapter(createAdapter(pub, sub));
}
```

Effects:

- `socket.join(conversationRoom)` replicated across nodes.
- `io.to(room).emit(...)` reaches all members cluster-wide.
- **No sticky sessions** when clients use websocket-only transport.

**Client (`api-client/socket.ts`):**

```ts
transports: ["websocket"],
```

### 4. Handler refactor (PR #14 follow-up)

- `registerPresenceHandlers` calls **`getPort("typingStore")`** / **`getPort("presenceStore")`** instead of `createPresenceRuntime()`.
- Remove `setInterval` prune from handlers — Redis TTL or explicit `EXPIRE`; DO alarms for CF.
- `emitConversationPresence` still uses `io.to(conversationRoom)` — adapter delivers cross-node.

### 5. Upload sessions (P1, can trail presence)

Move `S3BlobStore.uploads` Map behind **`UploadSessionStore`** port, or persist `upload_id` + completed parts on the **`attachments`** row (Postgres) so any instance can `uploadPart` / `completeUpload`.

---

## Deployment notes

| Topology | Socket.IO | Ephemeral store |
| --- | --- | --- |
| **Single Node dev** | local adapter | in-memory |
| **Node replicas (AWS/k8s)** | Redis adapter | Redis |
| **Cloudflare Workers** | Socket.IO does **not** run on Workers | Durable Objects for typing/presence; realtime may live on a **dedicated Node SFU/API** service or future CF-native transport |
| **Hybrid (CF edge + Node API)** | Node cluster with Redis adapter | Redis on Node; DO only if edge needs local reads |

Meetings (LiveKit) are a separate media plane; this audit is **messaging Socket.IO + upload sessions + scheduler** only.

---

## Phased plan

| Phase | Ticket | Deliverable | Blocks |
| --- | --- | --- | --- |
| **A** | **30** | Contracts + ports; in-memory adapters; refactor PR #14 handlers to ports; tests unchanged | Merge **10** only after A, **or** merge 10 then immediate 30 before multi-instance deploy |
| **B** | **30** (cont.) | Redis adapters + Socket.IO redis adapter; env wiring; websocket-only client | Horizontal Node deploy |
| **C** | **31** (new) | `UploadSessionStore` + Redis adapter; remove `S3BlobStore.uploads` Map | Multi-instance uploads |
| **D** | later | Durable Object adapters for CF-specific deployment | CF production |

**Recommendation for PR #14:** Do **not** ship to production multi-instance without Phase **A+B**. OK to merge for single-node dev if **30** is queued immediately.

---

## Acceptance criteria (Phase A+B)

- [ ] No `Map` holding typing/presence in `realtime/` production path (only inside in-memory adapter)
- [ ] `REALTIME_ADAPTER=redis` + two API processes: typing on A visible to client on B
- [ ] `message.created` emit from HTTP on A delivered to socket on B
- [ ] Client uses `transports: ["websocket"]` only
- [ ] Document env vars in `.env.example`
- [ ] Unit tests use in-memory adapters; optional integration test with Redis (docker)

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-09-05 | Initial audit after PR #14 presence review |
