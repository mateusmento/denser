import { z } from "zod";
import { ArtifactId, AttachmentId, ClientId, MessageId, UserId } from "./ids.js";

export const MessageIdSchema = MessageId;
export type { MessageId };

export const ListMessagesDirection = z.enum(["next", "prev"]);
export type ListMessagesDirection = z.infer<typeof ListMessagesDirection>;

export const ListMessagesQuery = z.object({
  conversationId: ArtifactId,
  size: z.coerce.number().int().positive().optional(),
  cursor: z.string().optional(),
  direction: ListMessagesDirection.optional(),
  around: MessageId.optional(),
});
export type ListMessagesQuery = z.infer<typeof ListMessagesQuery>;

export const QuotedPreviewAuthor = z.object({
  id: UserId,
  name: z.string(),
  avatarUrl: z.string().nullable().optional(),
});
export type QuotedPreviewAuthor = z.infer<typeof QuotedPreviewAuthor>;

export const QuotedPreviewDto = z.object({
  id: MessageId,
  author: QuotedPreviewAuthor,
  body: z.unknown(),
  displayContent: z.string(),
  sizeCapped: z.boolean().optional(),
  hasAttachment: z.boolean().optional(),
});
export type QuotedPreviewDto = z.infer<typeof QuotedPreviewDto>;

export const MessageDto = z.object({
  id: MessageId,
  conversationId: ArtifactId,
  threadId: MessageId.nullable(),
  quotesId: MessageId.nullable(),
  authorId: UserId,
  body: z.unknown(),
  clientId: ClientId.nullable(),
  createdAt: z.string(),
  editedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  attachmentIds: z.array(AttachmentId),
  quoted: QuotedPreviewDto.nullable().optional(),
  wasScheduled: z.boolean().optional(),
});
export type MessageDto = z.infer<typeof MessageDto>;

export const PostMessageInput = z.object({
  conversationId: ArtifactId,
  body: z.unknown().optional(),
  quotesId: MessageId.nullable().optional(),
  threadId: MessageId.nullable().optional(),
  clientId: ClientId,
  attachmentIds: z.array(AttachmentId).optional(),
});
export type PostMessageInput = z.infer<typeof PostMessageInput>;

export const EditMessageInput = z.object({
  body: z.unknown(),
});
export type EditMessageInput = z.infer<typeof EditMessageInput>;

export const ListMessagesResponse = z.object({
  messages: z.array(MessageDto),
  nextCursor: z.string().nullable(),
  prevCursor: z.string().nullable(),
});
export type ListMessagesResponse = z.infer<typeof ListMessagesResponse>;

export const PostMessageResponse = z.object({
  message: MessageDto,
});
export type PostMessageResponse = z.infer<typeof PostMessageResponse>;

export const ListThreadMessagesQuery = z.object({
  conversationId: ArtifactId,
  threadId: MessageId,
  size: z.coerce.number().int().positive().optional(),
  cursor: z.string().optional(),
  direction: ListMessagesDirection.optional(),
});
export type ListThreadMessagesQuery = z.infer<typeof ListThreadMessagesQuery>;

export const ThreadSummaryDto = z.object({
  threadId: MessageId,
  replyCount: z.number().int().nonnegative(),
  lastReplyAt: z.string().nullable(),
});
export type ThreadSummaryDto = z.infer<typeof ThreadSummaryDto>;

export const ThreadSummaryResponse = z.object({
  thread: ThreadSummaryDto,
});
export type ThreadSummaryResponse = z.infer<typeof ThreadSummaryResponse>;

export const MESSAGE_CREATED_EVENT = "message.created" as const;
export const MESSAGE_UPDATED_EVENT = "message.updated" as const;
export const MESSAGE_DELETED_EVENT = "message.deleted" as const;

export const MessageEvents = [
  MESSAGE_CREATED_EVENT,
  MESSAGE_UPDATED_EVENT,
  MESSAGE_DELETED_EVENT,
] as const;
export type MessageEvent = (typeof MessageEvents)[number];
