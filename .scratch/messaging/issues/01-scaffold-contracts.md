# 01 — Scaffold messaging contracts

**Type:** task  
**Status:** ready-for-agent  
**Blocked by:** None — can start immediately  
**Branch:** `agent/messaging-01-scaffold-contracts`  
**Spec:** [interfaces.md](../interfaces.md), [docs/CONVERSATIONS.md](../../../docs/CONVERSATIONS.md)

**What to build:** Publish the shared TypeScript/Zod contracts (IDs + DTOs + query/command input shapes) in `@denser/contracts` so every later messaging PR imports one SoT. No HTTP handlers, no DB migrations in this ticket.

**Owns:** new files under `packages/contracts/src/` for messaging (e.g. `message.ts`, `attachment.ts`, `message-draft.ts`, `scheduling.ts`); exports from `packages/contracts/src/index.ts`; keep [interfaces.md](../interfaces.md) in sync if names differ slightly.

**Must not touch:** `packages/api` schema/handlers, app feature UI (except if a type-only import is required for compile — prefer not).

**Publishes:** all types listed in [interfaces.md](../interfaces.md) (Messages, AttachmentDto, MessageDraftDto, ScheduledJobDto, anchors, ListMessagesQuery, PostMessageInput, etc.).

- [ ] Branded IDs added for Message, Attachment, MessageDraft, ScheduledJob, ClientId
- [ ] Zod schemas + exported types for MessageDto, QuotedPreviewDto, ListMessagesQuery, PostMessageInput
- [ ] Zod schemas for AttachmentDto, AttachmentAnchor, MessageDraftDto, UpsertMessageDraftInput
- [ ] Zod schemas for ScheduledJob: **discriminated union** payloads per `type`, `ScheduledJobDto<T>`, `parseScheduledJob` / `parseScheduledJobPayload`, factories (`createScheduledMessageJob`, `createMeetingStartJob`, `createMeetingReminderJob`)
- [ ] Adding a payload type without factory + schema fails TypeScript exhaustiveness (handler map typed)
- [ ] Socket event name constants for message.* (and placeholders for draft/schedule if useful)
- [ ] `pnpm` typecheck for contracts package passes
- [ ] PR title `[messaging 01] …`; body links this issue

## Comments

Agent: do not invent parallel DTO names; follow interfaces.md. TipTap body stays `unknown` / `z.unknown()` at the boundary.
