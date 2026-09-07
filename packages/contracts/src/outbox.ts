import { z } from "zod";
import { ArtifactId, MessageDraftId, MessageId, ScheduledJobId } from "./ids.js";
import { ScheduledJobRecurrenceSchema } from "./scheduling.js";

export const OutboxContextLabel = z.enum(["channel", "thread"]);
export type OutboxContextLabel = z.infer<typeof OutboxContextLabel>;

export const DraftOutboxItemDto = z.object({
  id: MessageDraftId,
  conversationId: ArtifactId,
  threadId: MessageId.nullable(),
  conversationLabel: z.string().nullable(),
  contextLabel: OutboxContextLabel,
  body: z.unknown().nullable(),
  expiresAt: z.string(),
});
export type DraftOutboxItemDto = z.infer<typeof DraftOutboxItemDto>;

export const ListDraftOutboxResponse = z.object({
  drafts: z.array(DraftOutboxItemDto),
});
export type ListDraftOutboxResponse = z.infer<typeof ListDraftOutboxResponse>;

export const DraftOutboxCountResponse = z.object({
  count: z.number().int().nonnegative(),
});
export type DraftOutboxCountResponse = z.infer<typeof DraftOutboxCountResponse>;

export const ScheduledOutboxItemDto = z.object({
  jobId: ScheduledJobId,
  conversationId: ArtifactId,
  threadId: MessageId.nullable(),
  conversationLabel: z.string().nullable(),
  contextLabel: OutboxContextLabel,
  body: z.unknown().nullable(),
  dueAt: z.string(),
  nextRunAt: z.string(),
  timezone: z.string().nullable(),
  recurrence: ScheduledJobRecurrenceSchema.nullable(),
});
export type ScheduledOutboxItemDto = z.infer<typeof ScheduledOutboxItemDto>;

export const ListScheduledOutboxResponse = z.object({
  scheduledMessages: z.array(ScheduledOutboxItemDto),
});
export type ListScheduledOutboxResponse = z.infer<typeof ListScheduledOutboxResponse>;

export const ScheduledOutboxCountResponse = z.object({
  count: z.number().int().nonnegative(),
});
export type ScheduledOutboxCountResponse = z.infer<typeof ScheduledOutboxCountResponse>;
