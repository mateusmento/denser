import type { ArtifactId, MessageId, UserId } from "@denser/contracts";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { message } from "../../db/schema/message.js";
import { messageReaction } from "../../db/schema/message-reaction.js";
import type { ReactionRepository, ReactionRow } from "./types.js";

function toRow(row: typeof messageReaction.$inferSelect): ReactionRow {
  return { messageId: row.messageId, emoji: row.emoji, userId: row.userId, reactedAt: row.reactedAt };
}

async function findMessageConversation(messageId: MessageId): Promise<ArtifactId | null> {
  const [row] = await db.select({ conversationId: message.conversationId }).from(message).where(eq(message.id, messageId)).limit(1);
  return row?.conversationId ?? null;
}

async function listForMessage(messageId: MessageId): Promise<ReactionRow[]> {
  const rows = await db.select().from(messageReaction).where(eq(messageReaction.messageId, messageId));
  return rows.map(toRow);
}

async function listForMessages(messageIds: readonly MessageId[]): Promise<ReactionRow[]> {
  if (messageIds.length === 0) return [];
  const rows = await db.select().from(messageReaction).where(inArray(messageReaction.messageId, messageIds));
  return rows.map(toRow);
}

async function removeReaction(input: { messageId: MessageId; emoji: string; userId: UserId }): Promise<boolean> {
  const deleted = await db.delete(messageReaction).where(and(
    eq(messageReaction.messageId, input.messageId),
    eq(messageReaction.emoji, input.emoji),
    eq(messageReaction.userId, input.userId),
  )).returning({ messageId: messageReaction.messageId });
  return deleted.length > 0;
}

async function addReaction(input: { messageId: MessageId; emoji: string; userId: UserId; reactedAt: Date }): Promise<void> {
  await db.insert(messageReaction).values({
    messageId: input.messageId,
    emoji: input.emoji,
    userId: input.userId,
    reactedAt: input.reactedAt,
  }).onConflictDoNothing();
}

export const reactionRepository: ReactionRepository = {
  findMessageConversation,
  listForMessage,
  listForMessages,
  removeReaction,
  addReaction,
};
