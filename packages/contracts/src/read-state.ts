import { z } from "zod";
import { ArtifactId, MessageId, SpaceId, UserId } from "./ids.js";

export const ConversationReadStateDto = z.object({
  conversationId: ArtifactId,
  userId: UserId,
  lastReadAt: z.string().datetime(),
});
export type ConversationReadStateDto = z.infer<typeof ConversationReadStateDto>;

export const MarkConversationReadInput = z.object({
  conversationId: ArtifactId,
  /** When omitted, advances to the latest message in the conversation. */
  messageId: MessageId.optional(),
});
export type MarkConversationReadInput = z.infer<typeof MarkConversationReadInput>;

export const MarkConversationReadResponse = z.object({
  readState: ConversationReadStateDto,
});
export type MarkConversationReadResponse = z.infer<typeof MarkConversationReadResponse>;

export const UnreadConversationSummary = z.object({
  conversationId: ArtifactId,
  unreadCount: z.number().int().nonnegative(),
  firstUnreadMessageId: MessageId.nullable(),
});
export type UnreadConversationSummary = z.infer<typeof UnreadConversationSummary>;

export const GetUnreadSummaryQuery = z.object({
  rootSpaceId: SpaceId,
});
export type GetUnreadSummaryQuery = z.infer<typeof GetUnreadSummaryQuery>;

export const GetUnreadSummaryResponse = z.object({
  conversations: z.array(UnreadConversationSummary),
});
export type GetUnreadSummaryResponse = z.infer<typeof GetUnreadSummaryResponse>;

export const READ_STATE_UPDATED_EVENT = "read_state.updated" as const;

export const ReadStateUpdatedEvent = z.object({
  conversationId: ArtifactId,
  userId: UserId,
  lastReadAt: z.string().datetime(),
});
export type ReadStateUpdatedEvent = z.infer<typeof ReadStateUpdatedEvent>;
