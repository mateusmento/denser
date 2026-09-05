import type {
  ArtifactId,
  AttachmentId,
  ClientId,
  MessageId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import type { message } from "../../db/schema/message.js";
import type { MessageCursor } from "./cursor.js";

export type MessageRow = typeof message.$inferSelect;

export type MessageListOptions = {
  size: number;
  cursor?: MessageCursor | null;
  direction: "next" | "prev" | "around";
  /** Anchor message for the `around` direction; the repo resolves and validates it. */
  anchorId?: MessageId;
};

export type ThreadListOptions = {
  size: number;
  cursor?: MessageCursor | null;
  direction: "next" | "prev";
};

export type ThreadSummaryRow = {
  replyCount: number;
  lastReplyAt: Date | null;
};

export type MessageRepository = {
  listMessages(conversationId: ArtifactId, opts: MessageListOptions): Promise<MessageRow[]>;
  listThreadMessages(threadId: MessageId, opts: ThreadListOptions): Promise<MessageRow[]>;
  countThreadReplies(threadId: MessageId): Promise<ThreadSummaryRow>;
  findMessageById(id: MessageId): Promise<MessageRow | undefined>;
  findClientMessage(
    conversationId: ArtifactId,
    clientId: ClientId,
  ): Promise<MessageRow | undefined>;
  insertMessage(input: {
    rootSpaceId: SpaceId | null;
    conversationId: ArtifactId;
    threadId: MessageId | null;
    quotesId: MessageId | null;
    authorId: UserId;
    body: unknown;
    clientId: ClientId | null;
  }): Promise<MessageRow>;
  loadAttachmentIdsForMessage(messageId: MessageId): Promise<AttachmentId[]>;
  loadAttachmentIdsForMessages(messageIds: readonly MessageId[]): Promise<
    Map<MessageId, AttachmentId[]>
  >;
  updateMessageBody(id: MessageId, authorId: UserId, body: unknown): Promise<MessageRow | null>;
  softDeleteMessage(id: MessageId, authorId: UserId): Promise<MessageRow | null>;
};