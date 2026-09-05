import type {
  ArtifactId,
  AttachmentId,
  ClientId,
  MessageId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { and, asc, count, desc, eq, gt, inArray, lt, max, or, type SQL } from "drizzle-orm";
import { db } from "../../db/client.js";
import { messageAttachment } from "../../db/schema/attachment.js";
import { message } from "../../db/schema/message.js";
import type { MessageCursor } from "./cursor.js";
import type { MessageRepository, MessageRow, ThreadListOptions, ThreadSummaryRow } from "./types.js";

type TupleCursor = Pick<MessageRow, "createdAt" | "id">;

/** `(created_at, id)` lexicographic comparison — older than cursor. */
function tupleBefore(cursor: TupleCursor): SQL {
  return or(
    lt(message.createdAt, cursor.createdAt),
    and(eq(message.createdAt, cursor.createdAt), lt(message.id, cursor.id)),
  )!;
}

/** `(created_at, id)` lexicographic comparison — newer than cursor. */
function tupleAfter(cursor: TupleCursor): SQL {
  return or(
    gt(message.createdAt, cursor.createdAt),
    and(eq(message.createdAt, cursor.createdAt), gt(message.id, cursor.id)),
  )!;
}

async function loadAttachmentIds(
  messageIds: readonly MessageId[],
): Promise<Map<MessageId, AttachmentId[]>> {
  if (messageIds.length === 0) return new Map();
  const rows = await db
    .select({
      messageId: messageAttachment.messageId,
      attachmentId: messageAttachment.attachmentId,
    })
    .from(messageAttachment)
    .where(inArray(messageAttachment.messageId, messageIds))
    .orderBy(messageAttachment.attachmentId);
  const map = new Map<MessageId, AttachmentId[]>();
  for (const row of rows) {
    const entry = map.get(row.messageId);
    if (entry) entry.push(row.attachmentId);
    else map.set(row.messageId, [row.attachmentId]);
  }
  return map;
}

async function fetchWindow(input: {
  conversationId: ArtifactId;
  size: number;
  where: SQL | undefined;
  orderBy: SQL[];
}): Promise<MessageRow[]> {
  return db
    .select()
    .from(message)
    .where(and(eq(message.conversationId, input.conversationId), input.where ?? undefined))
    .orderBy(...input.orderBy)
    .limit(input.size);
}

async function fetchThreadWindow(input: {
  threadId: MessageId;
  size: number;
  where: SQL | undefined;
  orderBy: SQL[];
}): Promise<MessageRow[]> {
  return db
    .select()
    .from(message)
    .where(and(eq(message.threadId, input.threadId), input.where ?? undefined))
    .orderBy(...input.orderBy)
    .limit(input.size);
}

/**
 * List a window of messages, ascending by `(created_at, id)`.
 *
 * - default (no cursor): the `size` most recent messages.
 * - `next` (older): the `size` messages immediately older than the cursor.
 * - `prev` (newer): the `size` messages immediately newer than the cursor.
 * - `around`: the `size` window containing the cursor's message.
 */
async function listMessages(
  conversationId: ArtifactId,
  opts: { size: number; cursor?: MessageCursor | null; direction: "next" | "prev" | "around"; anchorId?: MessageId },
): Promise<MessageRow[]> {
  if (opts.direction === "around") {
    return opts.anchorId
      ? listAround(conversationId, opts.anchorId, opts.size)
      : listLinear(conversationId, { ...opts, direction: "next", cursor: null });
  }
  return listLinear(conversationId, opts);
}

async function listLinear(
  conversationId: ArtifactId,
  opts: { size: number; cursor?: MessageCursor | null; direction: "next" | "prev" | "around" },
): Promise<MessageRow[]> {
  if (opts.direction === "prev" && opts.cursor) {
    return fetchWindow({
      conversationId,
      size: opts.size,
      where: tupleAfter(opts.cursor),
      orderBy: [asc(message.createdAt), asc(message.id)],
    });
  }

  if (opts.direction === "next" && opts.cursor) {
    const rows = await fetchWindow({
      conversationId,
      size: opts.size,
      where: tupleBefore(opts.cursor),
      orderBy: [desc(message.createdAt), desc(message.id)],
    });
    return rows.reverse();
  }

  const rows = await fetchWindow({
    conversationId,
    size: opts.size,
    where: undefined,
    orderBy: [desc(message.createdAt), desc(message.id)],
  });
  return rows.reverse();
}

async function listAround(
  conversationId: ArtifactId,
  anchorId: MessageId,
  size: number,
): Promise<MessageRow[]> {
  const anchor = await findMessageById(anchorId);
  if (!anchor || anchor.conversationId !== conversationId) {
    return listLinear(conversationId, { size, cursor: null, direction: "next" });
  }

  const olderCount = Math.floor(size / 2);
  const newerCount = size - olderCount - 1;

  const older = await fetchWindow({
    conversationId,
    size: olderCount,
    where: tupleBefore(anchor),
    orderBy: [desc(message.createdAt), desc(message.id)],
  });

  const newer =
    newerCount > 0
      ? await fetchWindow({
          conversationId,
          size: newerCount,
          where: tupleAfter(anchor),
          orderBy: [asc(message.createdAt), asc(message.id)],
        })
      : [];

  return [...older.reverse(), anchor, ...newer];
}

/**
 * List thread replies (messages where `thread_id` = parent), ascending by `(created_at, id)`.
 *
 * Same cursor semantics as `listMessages`, without the `around` direction.
 */
async function listThreadMessages(
  threadId: MessageId,
  opts: ThreadListOptions,
): Promise<MessageRow[]> {
  if (opts.direction === "prev" && opts.cursor) {
    return fetchThreadWindow({
      threadId,
      size: opts.size,
      where: tupleAfter(opts.cursor),
      orderBy: [asc(message.createdAt), asc(message.id)],
    });
  }

  if (opts.direction === "next" && opts.cursor) {
    const rows = await fetchThreadWindow({
      threadId,
      size: opts.size,
      where: tupleBefore(opts.cursor),
      orderBy: [desc(message.createdAt), desc(message.id)],
    });
    return rows.reverse();
  }

  const rows = await fetchThreadWindow({
    threadId,
    size: opts.size,
    where: undefined,
    orderBy: [desc(message.createdAt), desc(message.id)],
  });
  return rows.reverse();
}

async function countThreadReplies(threadId: MessageId): Promise<ThreadSummaryRow> {
  const [row] = await db
    .select({
      replyCount: count(),
      lastReplyAt: max(message.createdAt),
    })
    .from(message)
    .where(eq(message.threadId, threadId));

  return {
    replyCount: Number(row?.replyCount ?? 0),
    lastReplyAt: row?.lastReplyAt ?? null,
  };
}

async function findMessageById(id: MessageId): Promise<MessageRow | undefined> {
  return db.query.message.findFirst({ where: eq(message.id, id) });
}

async function findMessagesByIds(ids: readonly MessageId[]): Promise<Map<MessageId, MessageRow>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select().from(message).where(inArray(message.id, [...ids]));
  return new Map(rows.map((row) => [row.id, row]));
}

async function findClientMessage(
  conversationId: ArtifactId,
  clientId: ClientId,
): Promise<MessageRow | undefined> {
  return db.query.message.findFirst({
    where: and(eq(message.conversationId, conversationId), eq(message.clientId, clientId)),
  });
}

async function insertMessage(input: {
  rootSpaceId: SpaceId | null;
  conversationId: ArtifactId;
  threadId: MessageId | null;
  quotesId: MessageId | null;
  authorId: UserId;
  body: unknown;
  clientId: ClientId | null;
}): Promise<MessageRow> {
  const [created] = await db
    .insert(message)
    .values({
      rootSpaceId: input.rootSpaceId,
      conversationId: input.conversationId,
      threadId: input.threadId,
      quotesId: input.quotesId,
      authorId: input.authorId,
      body: input.body,
      clientId: input.clientId,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert message");
  }
  return created;
}

async function loadAttachmentIdsForMessage(messageId: MessageId): Promise<AttachmentId[]> {
  const map = await loadAttachmentIds([messageId]);
  return map.get(messageId) ?? [];
}

async function loadAttachmentIdsForMessages(
  messageIds: readonly MessageId[],
): Promise<Map<MessageId, AttachmentId[]>> {
  return loadAttachmentIds(messageIds);
}

async function updateMessageBody(
  id: MessageId,
  authorId: UserId,
  body: unknown,
): Promise<MessageRow | null> {
  const [updated] = await db
    .update(message)
    .set({ body, editedAt: new Date() })
    .where(and(eq(message.id, id), eq(message.authorId, authorId)))
    .returning();
  return updated ?? null;
}

async function softDeleteMessage(id: MessageId, authorId: UserId): Promise<MessageRow | null> {
  const [updated] = await db
    .update(message)
    .set({ deletedAt: new Date() })
    .where(and(eq(message.id, id), eq(message.authorId, authorId)))
    .returning();
  return updated ?? null;
}

export const messageRepository: MessageRepository = {
  listMessages,
  listThreadMessages,
  countThreadReplies,
  findMessageById,
  findMessagesByIds,
  findClientMessage,
  insertMessage,
  loadAttachmentIdsForMessage,
  loadAttachmentIdsForMessages,
  updateMessageBody,
  softDeleteMessage,
};