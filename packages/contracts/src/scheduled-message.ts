import { z } from "zod";
import { AttachmentDto } from "./attachment.js";
import { ArtifactId, AttachmentId, MessageId, ScheduledJobId } from "./ids.js";
import type { ScheduledJobDto } from "./scheduling.js";

export const SCHEDULED_MESSAGE_UPSERTED_EVENT = "scheduled_message.upserted" as const;
export const SCHEDULED_MESSAGE_CANCELLED_EVENT = "scheduled_message.cancelled" as const;

export const ScheduleMessageInput = z.object({
  dueAt: z.string().min(1),
  body: z.unknown(),
  quotesId: MessageId.nullable().optional(),
  threadId: MessageId.nullable().optional(),
  attachmentIds: z.array(AttachmentId).optional(),
});
export type ScheduleMessageInput = z.infer<typeof ScheduleMessageInput>;

export const UpdateScheduledMessageInput = z
  .object({
    dueAt: z.string().min(1).optional(),
    body: z.unknown().optional(),
    quotesId: MessageId.nullable().optional(),
    threadId: MessageId.nullable().optional(),
    attachmentIds: z.array(AttachmentId).optional(),
  })
  .refine(
    (value) =>
      value.dueAt !== undefined ||
      value.body !== undefined ||
      value.quotesId !== undefined ||
      value.threadId !== undefined ||
      value.attachmentIds !== undefined,
    { message: "At least one field is required" },
  );
export type UpdateScheduledMessageInput = z.infer<typeof UpdateScheduledMessageInput>;

/** API view: typed job row plus hydrated attachment tiles. */
export type ScheduledMessageDto = ScheduledJobDto<"scheduled_message"> & {
  attachments: AttachmentDto[];
  lastError?: string | null;
};

export const ScheduleMessageResponse = z.object({
  scheduledMessage: z.custom<ScheduledMessageDto>(),
});
export type ScheduleMessageResponse = { scheduledMessage: ScheduledMessageDto };

export const ListScheduledMessagesResponse = z.object({
  scheduledMessages: z.array(z.custom<ScheduledMessageDto>()),
});
export type ListScheduledMessagesResponse = { scheduledMessages: ScheduledMessageDto[] };

export const ScheduledMessageUpsertedEventSchema = z.object({
  conversationId: ArtifactId,
  scheduledMessage: z.custom<ScheduledMessageDto>(),
});
export type ScheduledMessageUpsertedEvent = {
  conversationId: ArtifactId;
  scheduledMessage: ScheduledMessageDto;
};

export const ScheduledMessageCancelledEventSchema = z.object({
  conversationId: ArtifactId,
  scheduledJobId: ScheduledJobId,
});
export type ScheduledMessageCancelledEvent = {
  conversationId: ArtifactId;
  scheduledJobId: ScheduledJobId;
};
