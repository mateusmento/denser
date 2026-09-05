# 01 — Messaging scaffold (contracts + schema + ports)

**Chunk:** 0  
**Layer:** api  
**Domain:** all  
**Status:** ready-for-agent  
**Blocked by:** None  
**Branch:** `agent/messaging-01-scaffold`  
**Specs:** [interfaces.md](../interfaces.md) · [COVERAGE.md](../COVERAGE.md) · [CHUNKS.md](../CHUNKS.md)


## Agent skills

**Required before API work:** read [codebase-design](../../../../.cursor/skills/codebase-design/SKILL.md).

- Design **deep modules** at clean **seams** (ports, repositories, domain services) — small interface, behaviour behind it.
- Implement messaging **ports** from [interfaces.md](../interfaces.md) (`BlobStore`, `AttachmentReferences`, `ClaimDueJobs`, …) — do not leak S3/SQL details into HTTP handlers.
- Keep route handlers **thin** — orchestrate; persistence and vendor SDKs stay in adapters.
- **Test through the interface** — unit tests on the module; integration tests at handler boundary when needed.

## What to build

Single combined scaffold PR: publish shared **contracts**, **drizzle tables + migration**, and **port stubs** so every later messaging PR imports one SoT. No HTTP handlers, no real S3, no claim SQL body, no feature UI.

**Owns:** `packages/contracts/src/*` messaging; `packages/api` schema + `ports/` + migration; keep [interfaces.md](../interfaces.md) in sync.

**Must not touch:** Feature handlers, app wiring, production BlobStore/AttachmentReferences/claim implementations.

**Publishes:** types in [interfaces.md](../interfaces.md); injectable `BlobStore`, `AttachmentReferences`, `ClaimDueJobs` symbols.

## Updates (task pack v2)

- **Merged** archive tickets **01** (contracts only) + **02** (schema + ports) into one PR — downstream agents need both on `main`.
- Renumbered: old 02 schema ticket is now part of **01**, not a separate blocker.

## API (backend)

### Contracts (`@denser/contracts`)

- [ ] Branded IDs: Message, Attachment, MessageDraft, ScheduledJob, ClientId
- [ ] Zod + types: `MessageDto`, `QuotedPreviewDto`, `ListMessagesQuery`, `PostMessageInput`
- [ ] Zod: `AttachmentDto`, `AttachmentAnchor`, `MessageDraftDto`, `UpsertMessageDraftInput`
- [ ] Scheduling: discriminated union payloads per `type`; `ScheduledJobDto<T>`; `parseScheduledJob` / `parseScheduledJobPayload`; factories (`createScheduledMessageJob`, `createMeetingStartJob`, `createMeetingReminderJob`)
- [ ] New payload type without factory + schema fails TS exhaustiveness (handler map typed)
- [ ] Socket event name constants for `message.*` (placeholders for draft/schedule OK)
- [ ] TipTap body stays `unknown` / `z.unknown()` at boundary — do not invent parallel DTO names

### Schema + ports (`packages/api`)

- [ ] Tables: messages, read_state, attachments, message_attachments, message_drafts, message_draft_attachments, scheduled_jobs, scheduled_job_attachments
- [ ] `conversation_peer` beside existing `conversation_member` (full migration deferred to **14**)
- [ ] Migration applies on empty/dev DB; does not break existing conversation artifact schema
- [ ] Port interfaces match [interfaces.md](../interfaces.md); stubs throw `NotImplemented` or no-op safely
- [ ] DI exports so feature tickets can inject ports
- [ ] Attachment row has **no** exclusive `message_id` FK

## App (frontend)

_N/A_

## Comments

Agent: follow [interfaces.md](../interfaces.md) names exactly. Opencode work may exist on `agent/messaging-02-scaffold-schema-ports` — retarget to this single ticket/branch.

## PR

- [ ] `[messaging 01] Messaging scaffold (contracts + schema + ports)` — [PR-POLICY.md](../PR-POLICY.md)
