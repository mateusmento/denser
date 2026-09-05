import { z } from "zod";
import { ArtifactId, AttachmentId, MessageDraftId, MessageId, UserId } from "./ids.js";
import { AttachmentDto } from "./attachment.js";

export const MessageDraftIdSchema = MessageDraftId;
export type { MessageDraftId };

export const MessageDraftDto = z.object({
  id: MessageDraftId,
  conversationId: ArtifactId,
  authorId: UserId,
  threadId: MessageId.nullable(),
  body: z.unknown(),
  quotesId: MessageId.nullable().optional(),
  version: z.number().int().nonnegative(),
  expiresAt: z.string(),
  attachments: z.array(AttachmentDto),
});
export type MessageDraftDto = z.infer<typeof MessageDraftDto>;

export const UpsertMessageDraftInput = z.object({
  conversationId: ArtifactId,
  threadId: MessageId.nullable().optional(),
  body: z.unknown(),
  attachmentIds: z.array(AttachmentId).optional(),
  quotesId: MessageId.nullable().optional(),
  version: z.number().int().nonnegative(),
});
export type UpsertMessageDraftInput = z.infer<typeof UpsertMessageDraftInput>;

export const GetMessageDraftResponse = z.object({
  draft: MessageDraftDto.nullable(),
});
export type GetMessageDraftResponse = z.infer<typeof GetMessageDraftResponse>;

export const UpsertMessageDraftResponse = z.object({
  draft: MessageDraftDto,
});
export type UpsertMessageDraftResponse = z.infer<typeof UpsertMessageDraftResponse>;

export const MessageDraftConflictResponse = z.object({
  error: z.literal("conflict"),
  draft: MessageDraftDto.nullable(),
});
export type MessageDraftConflictResponse = z.infer<typeof MessageDraftConflictResponse>;
