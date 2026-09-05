# 06 — BlobStore port adapters (S3 + R2)

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** 02 — Scaffold messaging DB schema + ports  
**Branch:** `agent/messaging-06-blobstore`  
**Spec:** [ATTACHMENTS.md](../../../docs/ATTACHMENTS.md), [interfaces.md](../interfaces.md)

**What to build:** Real **BlobStore** adapters for **AWS S3** and **Cloudflare R2** with progressive upload and **cancel/abort**. Config selects adapter. No reference-graph orchestration here.

**Owns:** BlobStore implementations; env/config; upload session helpers; unit/integration tests with mocks or localstack if available.

**Must not touch:** AttachmentReferences commit/load (07); message HTTP; drafts HTTP.

**Consumes:** BlobStore interface + Attachment row fields from 02; AttachmentId from 01.

- [ ] S3 adapter: multipart or SDK Upload with progress + abort
- [ ] R2 adapter: same port surface (S3-compatible)
- [ ] createUpload creates Attachment row metadata + storage key lifecycle as designed in ATTACHMENTS
- [ ] cancel aborts in-flight upload; orphan sweep can be stubbed/hook for 07
- [ ] Feature flag / env to pick adapter
- [ ] PR `[messaging 06] …`

## Comments

Do not put vendor URLs as SoT on messages — return attachment ids + app getUrl.
