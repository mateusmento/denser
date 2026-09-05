# Messaging — shared interfaces

Scaffold tickets (**01**, **02**) **publish** these seams. Parallel tickets **consume** them and must not redesign them without a docs + contracts PR.

Types live in `@denser/contracts`. Ports/services live under `packages/api` (names may match denser module layout; keep the **shapes**).

---

## IDs (`@denser/contracts`)

| Brand | Notes |
| --- | --- |
| `MessageId` | |
| `AttachmentId` | |
| `MessageDraftId` | |
| `ScheduledJobId` | |
| `ClientId` | uuid for optimistic send |
| Existing | `ArtifactId`, `UserId`, `SpaceId` (workspace = private root) |

---

## Messages

```ts
// Conceptual — publish as Zod + inferred types in contracts
type ListMessagesQuery = {
  conversationId: ArtifactId
  size?: number // default ~20
  cursor?: string // opaque (created_at, id)
  direction?: 'next' | 'prev' // next = older, prev = newer
  around?: MessageId
}

type MessageDto = {
  id: MessageId
  conversationId: ArtifactId
  threadId: MessageId | null
  quotesId: MessageId | null
  authorId: UserId
  body: unknown // TipTap JSON
  clientId: ClientId | null
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  attachmentIds: AttachmentId[]
  quoted?: QuotedPreviewDto | null
  wasScheduled?: boolean
}

type QuotedPreviewDto = {
  id: MessageId
  author: { id: UserId; name: string; avatarUrl?: string | null }
  body: unknown // TipTap; images stripped; ≤1000 text chars + 8KiB JSON
  displayContent: string // ≤160
  sizeCapped?: boolean
  hasAttachment?: boolean
}

type PostMessageInput = {
  conversationId: ArtifactId
  body?: unknown
  quotesId?: MessageId | null
  threadId?: MessageId | null
  clientId: ClientId
  attachmentIds?: AttachmentId[]
  // internal only — not on public HTTP:
  // markAsScheduled?, occurrenceKey?, trustedDelivery?
}
```

**Events (socket):** `message.created` | `message.updated` | `message.deleted` — payload includes `MessageDto` shape (or id + patch). Reconcile optimism by `clientId`.

---

## BlobStore port

```ts
type BlobStore = {
  createUpload(input: {
    rootSpaceId: SpaceId
    uploadedBy: UserId // uploader (authenticated user) — required to seed the `attachments` row
    filename: string
    mimeType: string
    byteSize: number
    conversationId?: ArtifactId | null // optional listing hint
  }): Promise<{ attachmentId: AttachmentId; upload: { /* multipart or put URL session */ } }>
  /** Progressive upload session supporting abort/cancel */
  uploadPart?(…): Promise<void>
  abortUpload(uploadId: string): Promise<void>
  completeUpload(uploadId: string): Promise<{ storageKey: string }>
  getUrl(storageKey: string): Promise<string>
  deleteObject(storageKey: string): Promise<void>
}
```

Adapters: **S3**, **R2**. App code depends on `BlobStore` only.

---

## Attachment references

```ts
type AttachmentAnchor =
  | { type: 'draft'; draftId: MessageDraftId }
  | { type: 'scheduled'; scheduledJobId: ScheduledJobId }
  | { type: 'message'; messageId: MessageId }

type AttachmentReferences = {
  commit(input:
    | { op: 'sync'; anchor: AttachmentAnchor; attachmentIds: AttachmentId[]; actor: Actor }
    | { op: 'release'; anchor: AttachmentAnchor; actor: Actor }
    | { op: 'releaseAttachment'; attachmentId: AttachmentId; actor: Actor }
    | { op: 'reclaim'; graceBefore: Date }
  ): Promise<void>
  load(anchor: AttachmentAnchor): Promise<AttachmentDto[]>
  listDeliveredForConversation(conversationId: ArtifactId): Promise<AttachmentDto[]>
}

type AttachmentDto = {
  id: AttachmentId
  rootSpaceId: SpaceId
  conversationId?: ArtifactId | null
  uploadedBy: UserId
  mimeType: string
  originalFilename: string
  byteSize: number
  url: string
  createdAt: string
}

type Actor = {
  userId: UserId
  trustedDelivery?: boolean // schedule fire / system only
}
```

---

## Message drafts

```ts
type MessageDraftDto = {
  id: MessageDraftId
  conversationId: ArtifactId
  authorId: UserId
  threadId: MessageId | null
  body: unknown
  quotesId?: MessageId | null
  version: number
  expiresAt: string
  attachments: AttachmentDto[]
}

type UpsertMessageDraftInput = {
  conversationId: ArtifactId
  threadId?: MessageId | null
  body: unknown
  attachmentIds?: AttachmentId[]
  quotesId?: MessageId | null
  version: number // 0 to create
}
```

---

## Scheduling

Typed payloads: discriminated union + factories + parse-on-read. See [SCHEDULING.md](../../../docs/SCHEDULING.md) typed payload contract.

```ts
import { z } from 'zod'
// ArtifactId, UserId, MessageId, SpaceId, ScheduledJobId from ids module

// --- Per-type payload schemas (each carries literal `type`) ---

const ScheduledMessagePayloadSchema = z.object({
  type: z.literal('scheduled_message'),
  conversationId: ArtifactIdSchema,
  senderId: UserIdSchema,
  body: z.unknown(), // TipTap JSON
  quotesId: MessageIdSchema.nullable().optional(),
  threadId: MessageIdSchema.nullable().optional(),
  // poll?: … when polls ship — no attachmentIds here
})

const MeetingStartPayloadSchema = z.object({
  type: z.literal('meeting_start'),
  meetingId: z.string().uuid(), // MeetingId brand when added
})

const MeetingReminderPayloadSchema = z.object({
  type: z.literal('meeting_reminder'),
  meetingId: z.string().uuid(),
  notifyMinutesBefore: z.number().int().positive(),
})

const ScheduledJobPayloadSchema = z.discriminatedUnion('type', [
  ScheduledMessagePayloadSchema,
  MeetingStartPayloadSchema,
  MeetingReminderPayloadSchema,
])

type ScheduledJobPayload = z.infer<typeof ScheduledJobPayloadSchema>
type ScheduledJobType = ScheduledJobPayload['type']

type ScheduledJobPayloadByType = {
  scheduled_message: z.infer<typeof ScheduledMessagePayloadSchema>
  meeting_start: z.infer<typeof MeetingStartPayloadSchema>
  meeting_reminder: z.infer<typeof MeetingReminderPayloadSchema>
}

// --- Job row DTO (discriminated on `type`) ---

type ScheduledJobDto<T extends ScheduledJobType = ScheduledJobType> = {
  id: ScheduledJobId
  rootSpaceId: SpaceId
  type: T
  payload: ScheduledJobPayloadByType[T]
  dueAt: string
  nextRunAt: string
  timezone?: string | null
  recurrence?: unknown | null
  processed: boolean
  lastOccurrenceAt?: string | null
}

// Convenience union for APIs that return mixed job types
type AnyScheduledJobDto = {
  [K in ScheduledJobType]: ScheduledJobDto<K>
}[ScheduledJobType]

// --- Parse (receiving end) ---

/** Validate row from DB or API; throws ZodError if type/payload mismatch */
function parseScheduledJobPayload(
  type: ScheduledJobType,
  raw: unknown,
): ScheduledJobPayloadByType[typeof type] {
  const parsed = ScheduledJobPayloadSchema.parse(
  typeof raw === 'object' && raw !== null && 'type' in raw
    ? raw
    : { type, ...(raw as object) },
  )
  if (parsed.type !== type) {
    throw new Error(`Job type ${type} does not match payload.type ${parsed.type}`)
  }
  return parsed as ScheduledJobPayloadByType[typeof type]
}

function parseScheduledJobRow(row: {
  id: ScheduledJobId
  rootSpaceId: SpaceId
  type: ScheduledJobType
  payload: unknown
  dueAt: string
  nextRunAt: string
  timezone?: string | null
  recurrence?: unknown | null
  processed: boolean
  lastOccurrenceAt?: string | null
}): AnyScheduledJobDto {
  const payload = parseScheduledJobPayload(row.type, row.payload)
  return { ...row, payload } as AnyScheduledJobDto
}

// --- Factories (creating end) ---

type CreateScheduledJobBase = {
  rootSpaceId: SpaceId
  dueAt: string
  nextRunAt: string
  timezone?: string | null
  recurrence?: unknown | null
}

function createScheduledMessageJob(
  base: CreateScheduledJobBase,
  input: Omit<z.infer<typeof ScheduledMessagePayloadSchema>, 'type'>,
): ScheduledJobDto<'scheduled_message'> {
  const payload = ScheduledMessagePayloadSchema.parse({
    type: 'scheduled_message',
    ...input,
  })
  return {
    id: '' as ScheduledJobId, // assigned on insert
    ...base,
    type: 'scheduled_message',
    payload,
    processed: false,
  }
}

function createMeetingStartJob(
  base: CreateScheduledJobBase,
  input: Omit<z.infer<typeof MeetingStartPayloadSchema>, 'type'>,
): ScheduledJobDto<'meeting_start'> {
  const payload = MeetingStartPayloadSchema.parse({ type: 'meeting_start', ...input })
  return { id: '' as ScheduledJobId, ...base, type: 'meeting_start', payload, processed: false }
}

// Export schemas + factories + parse helpers from @denser/contracts/scheduling

// --- Handler registry (server) ---

type ScheduledJobHandler<T extends ScheduledJobType> = (
  job: ScheduledJobDto<T> & { occurrenceKey: string },
  ctx: { lockId: string },
) => Promise<void>

type ScheduledJobHandlerMap = {
  [K in ScheduledJobType]: ScheduledJobHandler<K>
}

// registerHandler<K extends ScheduledJobType>(type: K, fn: ScheduledJobHandler<K>)
// dispatch: parseScheduledJobRow(claimed) → handlers[job.type](job, ctx)

type ClaimDueJobs = (input: {
  now: Date
  limit: number
  staleLockBefore: Date
}) => Promise<{ lockId: string; jobs: Array<AnyScheduledJobDto & { occurrenceKey: string }> }>
```

**Client list/get:** map `AnyScheduledJobDto` to UI view-models; `switch (job.type)` must be exhaustive. **Never** read `job.payload.conversationId` without narrowing on `job.type === 'scheduled_message'`.

Public schedule-message HTTP uses `createScheduledMessageJob` input shape (ticket **11**), not raw jsonb.

---

## Conversation peers

```ts
// Target model (ticket 13 may expand-contract from conversation_member)
type ConversationPeer = {
  conversationArtifactId: ArtifactId
  userId: UserId
}
```

Access: peer ∩ workspace member for directs; space ACL for regular.

---

## Stability rules

1. Parallel PRs may **add** handlers/routes that import these types; they must not change field meanings without updating docs + this file + **01**.
2. Stub implementations (`NotImplemented` / in-memory) are OK behind a port until the owner ticket lands — prefer DI so **03** can post without real S3.
3. TipTap body remains `unknown` at the contract boundary until a shared schema module exists; validate in API.
4. **ScheduledJob `payload` is always parsed/created via `@denser/contracts` factories and Zod schemas** — no `Record<string, unknown>` at handler or HTTP boundaries.
