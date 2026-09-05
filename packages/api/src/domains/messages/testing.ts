import type {
  ArtifactId,
  AttachmentId,
  ClientId,
  MessageId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import type { MessageCursor } from "./cursor.js";
import type { MessageRepository, MessageRow } from "./types.js";

export function createInMemoryMessageRepository(): {
  repo: MessageRepository;
  state: {
    rows: Map<MessageId, MessageRow>;
    attachmentIds: Map<MessageId, AttachmentId[]>;
  };
} {
  const rows = new Map<MessageId, MessageRow>();
  const attachmentIds = new Map<MessageId, AttachmentId[]>();
  let seq = 0;

  function cursorKey(row: Pick<MessageRow, "createdAt" | "id">): string {
    return `${row.createdAt.toISOString()}|${row.id}`;
  }

  function sortedByConversation(conversationId: ArtifactId): MessageRow[] {
    return [...rows.values()]
      .filter((row) => row.conversationId === conversationId)
      .sort((a, b) => cursorKey(a).localeCompare(cursorKey(b)));
  }

  function afterCursor(row: MessageRow, cursor: MessageCursor | null | undefined): boolean {
    return cursor == null || cursorKey(row) > cursorKey(cursor);
  }

  function beforeCursor(row: MessageRow, cursor: MessageCursor | null | undefined): boolean {
    return cursor != null && cursorKey(row) < cursorKey(cursor);
  }

  async function listMessages(
    conversationId: ArtifactId,
    opts: {
      size: number;
      cursor?: MessageCursor | null;
      direction: "next" | "prev" | "around";
      anchorId?: MessageId;
    },
  ): Promise<MessageRow[]> {
    const all = sortedByConversation(conversationId);

    if (opts.direction === "around") {
      const anchor = opts.anchorId ? rows.get(opts.anchorId) : undefined;
      if (!anchor || anchor.conversationId !== conversationId) {
        return all.slice(-opts.size);
      }
      const cursor = { createdAt: anchor.createdAt, id: anchor.id };
      const older = all.filter((r) => beforeCursor(r, cursor)).slice(-Math.floor(opts.size / 2));
      const rest = all.filter((r) => afterCursor(r, cursor)).slice(0, opts.size - older.length - 1);
      return [...older, anchor, ...rest];
    }

    if (opts.direction === "prev" && opts.cursor) {
      return all.filter((r) => afterCursor(r, opts.cursor)).slice(0, opts.size);
    }

    if (opts.direction === "next" && opts.cursor) {
      return all.filter((r) => beforeCursor(r, opts.cursor)).slice(-opts.size);
    }

    return all.slice(-opts.size);
  }

  async function listThreadMessages(
    threadId: MessageId,
    opts: {
      size: number;
      cursor?: MessageCursor | null;
      direction: "next" | "prev";
    },
  ): Promise<MessageRow[]> {
    const all = [...rows.values()]
      .filter((row) => row.threadId === threadId)
      .sort((a, b) => cursorKey(a).localeCompare(cursorKey(b)));

    if (opts.direction === "prev" && opts.cursor) {
      return all.filter((r) => afterCursor(r, opts.cursor)).slice(0, opts.size);
    }

    if (opts.direction === "next" && opts.cursor) {
      return all.filter((r) => beforeCursor(r, opts.cursor)).slice(-opts.size);
    }

    return all.slice(-opts.size);
  }

  async function countThreadReplies(threadId: MessageId): Promise<{
    replyCount: number;
    lastReplyAt: Date | null;
  }> {
    const replies = [...rows.values()].filter((row) => row.threadId === threadId);
    const lastReply = replies.at(-1);
    return {
      replyCount: replies.length,
      lastReplyAt: lastReply?.createdAt ?? null,
    };
  }

  async function findMessageById(id: MessageId): Promise<MessageRow | undefined> {
    return rows.get(id);
  }

  async function findClientMessage(
    conversationId: ArtifactId,
    clientId: ClientId,
  ): Promise<MessageRow | undefined> {
    return [...rows.values()].find(
      (row) => row.conversationId === conversationId && row.clientId === clientId,
    );
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
    seq += 1;
    const now = new Date(1_000_000 * seq);
    const row: MessageRow = {
      id: `m-${seq}` as MessageId,
      rootSpaceId: input.rootSpaceId,
      conversationId: input.conversationId,
      threadId: input.threadId,
      quotesId: input.quotesId,
      authorId: input.authorId,
      body: input.body,
      clientId: input.clientId,
      occurrenceKey: null,
      createdAt: now,
      editedAt: null,
      deletedAt: null,
    };
    rows.set(row.id, row);
    return row;
  }

  async function loadAttachmentIdsForMessage(messageId: MessageId): Promise<AttachmentId[]> {
    return attachmentIds.get(messageId) ?? [];
  }

  async function loadAttachmentIdsForMessages(
    messageIds: readonly MessageId[],
  ): Promise<Map<MessageId, AttachmentId[]>> {
    const out = new Map<MessageId, AttachmentId[]>();
    for (const id of messageIds) {
      const ids = attachmentIds.get(id);
      if (ids) out.set(id, ids);
    }
    return out;
  }

  async function updateMessageBody(
    id: MessageId,
    authorId: UserId,
    body: unknown,
  ): Promise<MessageRow | null> {
    const row = rows.get(id);
    if (!row || row.authorId !== authorId) return null;
    const updated = { ...row, body, editedAt: new Date() };
    rows.set(id, updated);
    return updated;
  }

  async function softDeleteMessage(id: MessageId, authorId: UserId): Promise<MessageRow | null> {
    const row = rows.get(id);
    if (!row || row.authorId !== authorId) return null;
    const updated = { ...row, deletedAt: new Date() };
    rows.set(id, updated);
    return updated;
  }

  const repo: MessageRepository = {
    listMessages,
    listThreadMessages,
    countThreadReplies,
    findMessageById,
    findClientMessage,
    insertMessage,
    loadAttachmentIdsForMessage,
    loadAttachmentIdsForMessages,
    updateMessageBody,
    softDeleteMessage,
  };

  return { repo, state: { rows, attachmentIds } };
}