import type { ArtifactId, MessageId, UserId } from "@denser/contracts";

export type ReactionRow = {
  messageId: MessageId;
  emoji: string;
  userId: UserId;
  reactedAt: Date;
};

export type ReactionRepository = {
  findMessageConversation(messageId: MessageId): Promise<ArtifactId | null>;
  listForMessage(messageId: MessageId): Promise<ReactionRow[]>;
  listForMessages(messageIds: readonly MessageId[]): Promise<ReactionRow[]>;
  removeReaction(input: { messageId: MessageId; emoji: string; userId: UserId }): Promise<boolean>;
  addReaction(input: { messageId: MessageId; emoji: string; userId: UserId; reactedAt: Date }): Promise<void>;
};
