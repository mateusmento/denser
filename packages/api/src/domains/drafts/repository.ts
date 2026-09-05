import type {
  ArtifactId,
  MessageDraftId,
  MessageId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { and, asc, eq, isNull, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { messageDraft } from "../../db/schema/message-draft.js";

export type MessageDraftRow = typeof messageDraft.$inferSelect;

export async function findDraftByKey(input: {
  conversationId: ArtifactId;
  authorId: UserId;
  threadId: MessageId | null;
}): Promise<MessageDraftRow | undefined> {
  const byKey =
    input.threadId === null
      ? and(
          eq(messageDraft.conversationId, input.conversationId),
          eq(messageDraft.authorId, input.authorId),
          isNull(messageDraft.threadId),
        )
      : and(
          eq(messageDraft.conversationId, input.conversationId),
          eq(messageDraft.authorId, input.authorId),
          eq(messageDraft.threadId, input.threadId),
        );

  return db.query.messageDraft.findFirst({ where: byKey });
}

export async function findDraftById(draftId: MessageDraftId): Promise<MessageDraftRow | undefined> {
  return db.query.messageDraft.findFirst({ where: eq(messageDraft.id, draftId) });
}

export async function insertDraft(input: {
  rootSpaceId: SpaceId;
  conversationId: ArtifactId;
  authorId: UserId;
  threadId: MessageId | null;
  body: unknown;
  quotesId: MessageId | null;
  version: number;
  expiresAt: Date;
}): Promise<MessageDraftRow> {
  const [created] = await db
    .insert(messageDraft)
    .values({
      rootSpaceId: input.rootSpaceId,
      conversationId: input.conversationId,
      authorId: input.authorId,
      threadId: input.threadId,
      body: input.body,
      quotesId: input.quotesId,
      version: input.version,
      expiresAt: input.expiresAt,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create message draft");
  }

  return created;
}

export async function updateDraft(input: {
  draftId: MessageDraftId;
  expectedVersion: number;
  body: unknown;
  quotesId?: MessageId | null;
  expiresAt: Date;
}): Promise<MessageDraftRow | undefined> {
  const [updated] = await db
    .update(messageDraft)
    .set({
      body: input.body,
      quotesId: input.quotesId,
      version: input.expectedVersion + 1,
      expiresAt: input.expiresAt,
    })
    .where(and(eq(messageDraft.id, input.draftId), eq(messageDraft.version, input.expectedVersion)))
    .returning();

  return updated;
}

export async function deleteDraft(draftId: MessageDraftId): Promise<void> {
  await db.delete(messageDraft).where(eq(messageDraft.id, draftId));
}

export async function listExpiredDrafts(now: Date, limit: number): Promise<MessageDraftRow[]> {
  return db
    .select()
    .from(messageDraft)
    .where(lt(messageDraft.expiresAt, now))
    .orderBy(asc(messageDraft.expiresAt))
    .limit(limit);
}