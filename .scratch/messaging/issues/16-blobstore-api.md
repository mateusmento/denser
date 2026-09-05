# 16 — BlobStore adapters (S3 + R2)

**Chunk:** 3a — Attachments storage (backend)  
**Layer:** api  
**Domain:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) A0  
**Status:** resolved  
**Blocked by:** 01 — Scaffold  
**Branch:** `agent/messaging-16-blobstore-api`  
**Specs:** [CHUNKS.md](../CHUNKS.md) · [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md) · [interfaces.md](../interfaces.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Real **BlobStore** port implementations for **AWS S3** and **Cloudflare R2**: progressive multipart upload, **abort/cancel**, create Attachment metadata row, resolve URLs. Config/env selects adapter. This ticket has **no UI** — upload UI is ticket **19**.

**Owns:** `packages/api` BlobStore adapters; env wiring; unit tests with mocks (localstack optional).

**Must not touch:** `AttachmentReferences` join logic (17); HTTP upload routes (18); `MessageComposer` (19).

**Publishes:** injectable BlobStore used by upload API and GC delete.

## Updates (task pack v2)

- **Renumbered** from archive **06** (blobstore). Split upload HTTP to **18**; composer UI to **19**.

## API (backend)

- [ ] S3 adapter: multipart / SDK `Upload` with progress hooks + **abort**
- [ ] R2 adapter: same port surface (S3-compatible API)
- [ ] `createUpload` creates `attachments` row (`storage_key`, mime, size, uploader, workspace)
- [ ] `getUrl` / `deleteObject` for refs + orphan sweep
- [ ] Feature flag or env (`BLOB_STORE_ADAPTER=s3|r2`) selects implementation
- [ ] Tests: happy path upload+abort; adapter selection

- [ ] `cancel` aborts in-flight upload; orphan sweep hook for **17** (may no-op until reclaim)
- [ ] Do not put vendor URLs as SoT on messages — return attachment ids + app `getUrl`

## App (frontend)

_N/A — no user-visible change in this PR._

## Reviewer notes

After merge you can verify with API/integration tests only. **You will not see upload in the app until 18 + 19.**

## PR

- [x] `[messaging 16] BlobStore adapters (S3 + R2)` — [PR-POLICY.md](../PR-POLICY.md) → PR #11
