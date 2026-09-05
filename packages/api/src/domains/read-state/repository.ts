import type { ArtifactId, MessageId, SpaceId, UserId } from "@denser/contracts";
import { and, asc, count, desc, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "../../db/client.js";
import { artifact } from "../../db/schema/artifact.js";
import { conversation } from "../../db/schema/conversation.js";
import { message, readState } from "../../db/schema/message.js";
import { space } from "../../db/schema/space.js";
import * as conversationRepository from "../conversations/repository.js";

export type ReadStateRow = typeof readState.$inferSelect;

export async function findReadState(
  conversationId: ArtifactId,
  userId: UserId,
): Promise<ReadStateRow | undefined> {
  return db.query.readState.findFirst({
    where: and(eq(readState.conversationId, conversationId), eq(readState.userId, userId)),
  });
}

export async function upsertReadState(input: {
  conversationId: ArtifactId;
  userId: UserId;
  lastReadAt: Date;
}): Promise<ReadStateRow> {
  const existing = await findReadState(input.conversationId, input.userId);
  if (existing && existing.lastReadAt >= input.lastReadAt) {
    return existing;
  }

  const [row] = await db
    .insert(readState)
    .values({
      conversationId: input.conversationId,
      userId: input.userId,
      lastReadAt: input.lastReadAt,
    })
    .onConflictDoUpdate({
      target: [readState.conversationId, readState.userId],
      set: {
        lastReadAt: input.lastReadAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to upsert read state");
  }

  return row;
}

export async function findLatestMessageCreatedAt(
  conversationId: ArtifactId,
): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: message.createdAt })
    .from(message)
    .where(and(eq(message.conversationId, conversationId), isNull(message.deletedAt)))
    .orderBy(desc(message.createdAt), desc(message.id))
    .limit(1);

  return row?.createdAt ?? null;
}

export async function findMessageCreatedAt(messageId: MessageId): Promise<Date | null> {
  const row = await db.query.message.findFirst({
    where: eq(message.id, messageId),
    columns: { createdAt: true, deletedAt: true },
  });
  if (!row || row.deletedAt) return null;
  return row.createdAt;
}

export async function countUnreadMessages(
  conversationId: ArtifactId,
  userId: UserId,
  lastReadAt: Date | null,
): Promise<number> {
  const where =
    lastReadAt == null
      ? and(
          eq(message.conversationId, conversationId),
          isNull(message.deletedAt),
          ne(message.authorId, userId),
        )
      : and(
          eq(message.conversationId, conversationId),
          isNull(message.deletedAt),
          ne(message.authorId, userId),
          gt(message.createdAt, lastReadAt),
        );

  const [row] = await db.select({ value: count() }).from(message).where(where);
  return Number(row?.value ?? 0);
}

export async function findFirstUnreadMessageId(
  conversationId: ArtifactId,
  userId: UserId,
  lastReadAt: Date | null,
): Promise<MessageId | null> {
  const where =
    lastReadAt == null
      ? and(
          eq(message.conversationId, conversationId),
          isNull(message.deletedAt),
          ne(message.authorId, userId),
        )
      : and(
          eq(message.conversationId, conversationId),
          isNull(message.deletedAt),
          ne(message.authorId, userId),
          gt(message.createdAt, lastReadAt),
        );

  const [row] = await db
    .select({ id: message.id })
    .from(message)
    .where(where)
    .orderBy(asc(message.createdAt), asc(message.id))
    .limit(1);

  return row?.id ?? null;
}

export async function listAccessibleConversationIds(
  userId: UserId,
  rootSpaceId: SpaceId,
): Promise<ArtifactId[]> {
  const directRows = await conversationRepository.listDirectConversationsForUser(
    rootSpaceId,
    userId,
  );

  const regularRows = await db
    .select({ id: artifact.id })
    .from(artifact)
    .innerJoin(conversation, eq(conversation.artifactId, artifact.id))
    .innerJoin(space, eq(space.id, artifact.spaceId))
    .where(
      and(
        eq(artifact.kind, "conversation"),
        eq(conversation.conversationKind, "regular"),
        eq(artifact.rootSpaceId, rootSpaceId),
      ),
    );

  const ids = new Set<ArtifactId>([
    ...directRows.map((row) => row.artifact.id),
    ...regularRows.map((row) => row.id),
  ]);

  return [...ids];
}
