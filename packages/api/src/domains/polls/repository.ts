import { randomUUID } from "node:crypto";
import type { ArtifactId, CreatePollInput, MessageId, PollId, PollOptionId, UserId } from "@denser/contracts";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { message } from "../../db/schema/message.js";
import { messagePoll, messagePollOption, messagePollVote } from "../../db/schema/message-poll.js";
import type { PollOptionRow, PollRepository, PollRow, PollVoteRow } from "./types.js";

function toPollRow(row: typeof messagePoll.$inferSelect): PollRow {
  return { id: row.id, messageId: row.messageId, question: row.question };
}

function toOptionRow(row: typeof messagePollOption.$inferSelect): PollOptionRow {
  return { id: row.id, pollId: row.pollId, label: row.label, position: row.position };
}

function toVoteRow(row: typeof messagePollVote.$inferSelect): PollVoteRow {
  return { pollId: row.pollId, userId: row.userId, optionId: row.optionId, votedAt: row.votedAt };
}

async function findMessageConversation(messageId: MessageId): Promise<ArtifactId | null> {
  const [row] = await db.select({ conversationId: message.conversationId }).from(message).where(eq(message.id, messageId)).limit(1);
  return row?.conversationId ?? null;
}

async function createPollForMessage(messageId: MessageId, input: CreatePollInput): Promise<PollRow> {
  const pollId = randomUUID() as PollId;
  const [poll] = await db.insert(messagePoll).values({ id: pollId, messageId, question: input.question }).returning();
  if (!poll) throw new Error("failed to create poll");
  await db.insert(messagePollOption).values(
    input.options.map((label, position) => ({
      id: randomUUID() as PollOptionId,
      pollId: poll.id,
      label,
      position,
    })),
  );
  return toPollRow(poll);
}

async function findPollByMessageId(messageId: MessageId): Promise<PollRow | null> {
  const [row] = await db.select().from(messagePoll).where(eq(messagePoll.messageId, messageId)).limit(1);
  return row ? toPollRow(row) : null;
}

async function listPollsForMessages(messageIds: readonly MessageId[]): Promise<PollRow[]> {
  if (messageIds.length === 0) return [];
  const rows = await db.select().from(messagePoll).where(inArray(messagePoll.messageId, messageIds));
  return rows.map(toPollRow);
}

async function listOptionsForPolls(pollIds: readonly PollId[]): Promise<PollOptionRow[]> {
  if (pollIds.length === 0) return [];
  const rows = await db.select().from(messagePollOption).where(inArray(messagePollOption.pollId, pollIds));
  return rows.map(toOptionRow);
}

async function listVotesForPolls(pollIds: readonly PollId[]): Promise<PollVoteRow[]> {
  if (pollIds.length === 0) return [];
  const rows = await db.select().from(messagePollVote).where(inArray(messagePollVote.pollId, pollIds));
  return rows.map(toVoteRow);
}

async function findPollById(pollId: PollId): Promise<PollRow | null> {
  const [row] = await db.select().from(messagePoll).where(eq(messagePoll.id, pollId)).limit(1);
  return row ? toPollRow(row) : null;
}

async function upsertVote(input: { pollId: PollId; userId: UserId; optionId: PollOptionId; votedAt: Date }): Promise<void> {
  await db
    .insert(messagePollVote)
    .values({
      pollId: input.pollId,
      userId: input.userId,
      optionId: input.optionId,
      votedAt: input.votedAt,
    })
    .onConflictDoUpdate({
      target: [messagePollVote.pollId, messagePollVote.userId],
      set: { optionId: input.optionId, votedAt: input.votedAt },
    });
}

async function optionBelongsToPoll(optionId: PollOptionId, pollId: PollId): Promise<boolean> {
  const [row] = await db
    .select({ id: messagePollOption.id })
    .from(messagePollOption)
    .where(and(eq(messagePollOption.id, optionId), eq(messagePollOption.pollId, pollId)))
    .limit(1);
  return row != null;
}

export const pollRepository: PollRepository = {
  findMessageConversation,
  createPollForMessage,
  findPollByMessageId,
  listPollsForMessages,
  listOptionsForPolls,
  listVotesForPolls,
  findPollById,
  upsertVote,
  optionBelongsToPoll,
};
