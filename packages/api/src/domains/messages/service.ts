import type {
  ArtifactId,
  AttachmentId,
  ListMessagesQuery,
  ListThreadMessagesQuery,
  MessageDto,
  MessageId,
  PostMessageInput,
  SpaceId,
  UserId,
} from "@denser/contracts";
import type { MessageCursor } from "./cursor.js";
import { decodeCursor, encodeCursor } from "./cursor.js";
import { toMessageDto } from "./mapper.js";
import type { MessageRepository, MessageRow } from "./types.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type ListMessagesResult =
  | {
      ok: true;
      messages: MessageDto[];
      nextCursor: string | null;
      prevCursor: string | null;
    }
  | { ok: false; reason: "not_found" | "invalid_cursor" };

export type ListThreadMessagesResult =
  | {
      ok: true;
      messages: MessageDto[];
      nextCursor: string | null;
      prevCursor: string | null;
    }
  | { ok: false; reason: "not_found" | "invalid_cursor" | "invalid_thread" };

export type PostMessageResult =
  | { ok: true; message: MessageDto }
  | { ok: false; reason: "not_found" | "invalid_message" | "invalid_thread" };

export type EditMessageResult =
  | { ok: true; message: MessageDto }
  | { ok: false; reason: "not_found" | "forbidden" };

export type DeleteMessageResult =
  | { ok: true; message: MessageDto }
  | { ok: false; reason: "not_found" | "forbidden" };

export type AccessContext = {
  conversationId: ArtifactId;
  rootSpaceId: SpaceId | null;
};

/** Resolve whether `userId` may read/write the conversation artifact. */
export type MessageAccess = (
  userId: UserId,
  conversationId: ArtifactId,
) => Promise<AccessContext | null>;

export type MessageAttachmentCoordinator = {
  commitSync(args: {
    conversationId: ArtifactId;
    messageId: MessageId;
    attachmentIds: AttachmentId[];
    actor: { userId: UserId };
  }): Promise<void>;
};

/** Real-time broadcast of authored messages to the conversation room. */
export type MessageEmitter = (
  conversationId: ArtifactId,
  event: "created" | "updated" | "deleted",
  message: MessageDto,
) => void;

export type MessageServiceDeps = {
  repo: MessageRepository;
  access: MessageAccess;
  attachments: MessageAttachmentCoordinator;
  emit: MessageEmitter;
};

export type MessageService = {
  listMessagesForConversation(
    userId: UserId,
    query: ListMessagesQuery,
  ): Promise<ListMessagesResult>;
  listThreadMessages(
    userId: UserId,
    query: ListThreadMessagesQuery,
  ): Promise<ListThreadMessagesResult>;
  postMessage(userId: UserId, input: PostMessageInput): Promise<PostMessageResult>;
  editMessage(userId: UserId, messageId: MessageId, body: unknown): Promise<EditMessageResult>;
  deleteMessage(userId: UserId, messageId: MessageId): Promise<DeleteMessageResult>;
};

export function createMessageService(deps: MessageServiceDeps): MessageService {
  const { repo } = deps;

  async function listMessagesForConversation(
    userId: UserId,
    query: ListMessagesQuery,
  ): Promise<ListMessagesResult> {
    const ctx = await deps.access(userId, query.conversationId);
    if (!ctx) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const size = clampSize(query.size);
    let cursor: MessageCursor | null = null;
    if (query.cursor) {
      cursor = decodeCursor(query.cursor);
      if (!cursor) {
        return { ok: false as const, reason: "invalid_cursor" as const };
      }
    }

    const rows = await repo.listMessages(ctx.conversationId, {
      size,
      cursor,
      direction: query.direction ?? (query.around ? "around" : "next"),
      ...(query.around ? { anchorId: query.around } : {}),
    });

    return toListResult(rows);
  }

  async function listThreadMessages(
    userId: UserId,
    query: ListThreadMessagesQuery,
  ): Promise<ListThreadMessagesResult> {
    const ctx = await deps.access(userId, query.conversationId);
    if (!ctx) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const parent = await repo.findMessageById(query.threadId);
    if (!parent || parent.conversationId !== query.conversationId) {
      return { ok: false as const, reason: "invalid_thread" as const };
    }

    const size = clampSize(query.size);
    let cursor: MessageCursor | null = null;
    if (query.cursor) {
      cursor = decodeCursor(query.cursor);
      if (!cursor) {
        return { ok: false as const, reason: "invalid_cursor" as const };
      }
    }

    const rows = await repo.listThreadMessages(query.threadId, {
      size,
      cursor,
      direction: query.direction ?? "next",
    });

    return toListResult(rows);
  }

  async function toListResult(rows: MessageRow[]): Promise<{
    ok: true;
    messages: MessageDto[];
    nextCursor: string | null;
    prevCursor: string | null;
  }> {
    const attachmentMap = await repo.loadAttachmentIdsForMessages(rows.map((r) => r.id));
    const messages = rows.map((row) => toMessageDto(row, attachmentMap.get(row.id) ?? []));

    const first = rows[0];
    const last = rows[rows.length - 1];
    const nextCursor = first ? encodeCursor({ createdAt: first.createdAt, id: first.id }) : null;
    const prevCursor = last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;
    return { ok: true as const, messages, nextCursor, prevCursor };
  }

  async function postMessage(
    userId: UserId,
    input: PostMessageInput,
  ): Promise<PostMessageResult> {
    const ctx = await deps.access(userId, input.conversationId);
    if (!ctx) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const attachmentIds = input.attachmentIds ?? [];
    const hasBody = input.body !== undefined && !isEmptyBody(input.body);
    if (!hasBody && attachmentIds.length === 0) {
      return { ok: false as const, reason: "invalid_message" as const };
    }

    const duplicate = await repo.findClientMessage(input.conversationId, input.clientId);
    if (duplicate) {
      return { ok: true as const, message: await messageDtoFor(duplicate) };
    }

    const threadId = input.threadId ?? null;
    if (threadId !== null) {
      const parent = await repo.findMessageById(threadId);
      if (!parent || parent.conversationId !== input.conversationId) {
        return { ok: false as const, reason: "invalid_thread" as const };
      }
    }

    const row = await repo.insertMessage({
      rootSpaceId: ctx.rootSpaceId,
      conversationId: input.conversationId,
      threadId,
      quotesId: input.quotesId ?? null,
      authorId: userId,
      body: input.body ?? null,
      clientId: input.clientId,
    });

    if (attachmentIds.length > 0) {
      await deps.attachments.commitSync({
        conversationId: input.conversationId,
        messageId: row.id,
        attachmentIds,
        actor: { userId },
      });
    }

    const dto = await messageDtoFor(row);
    deps.emit(input.conversationId, "created", dto);
    return { ok: true as const, message: dto };
  }

  async function editMessage(
    userId: UserId,
    messageId: MessageId,
    body: unknown,
  ): Promise<EditMessageResult> {
    const row = await repo.findMessageById(messageId);
    if (!row || row.deletedAt) {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (row.authorId !== userId) {
      return { ok: false as const, reason: "forbidden" as const };
    }
    if (isEmptyBody(body)) {
      return { ok: false as const, reason: "forbidden" as const };
    }

    const updated = await repo.updateMessageBody(messageId, userId, body);
    if (!updated) {
      return { ok: false as const, reason: "not_found" as const };
    }
    const dto = await messageDtoFor(updated);
    deps.emit(updated.conversationId, "updated", dto);
    return { ok: true as const, message: dto };
  }

  async function deleteMessage(
    userId: UserId,
    messageId: MessageId,
  ): Promise<DeleteMessageResult> {
    const row = await repo.findMessageById(messageId);
    if (!row || row.deletedAt) {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (row.authorId !== userId) {
      return { ok: false as const, reason: "forbidden" as const };
    }

    const updated = await repo.softDeleteMessage(messageId, userId);
    if (!updated) {
      return { ok: false as const, reason: "not_found" as const };
    }
    const dto = await messageDtoFor(updated);
    deps.emit(updated.conversationId, "deleted", dto);
    return { ok: true as const, message: dto };
  }

  async function messageDtoFor(row: MessageRow): Promise<MessageDto> {
    const attachmentIds = await repo.loadAttachmentIdsForMessage(row.id);
    return toMessageDto(row, attachmentIds);
  }

  return {
    listMessagesForConversation,
    listThreadMessages,
    postMessage,
    editMessage,
    deleteMessage,
  };
}

function clampSize(requested: number | undefined): number {
  if (requested === undefined) return DEFAULT_PAGE_SIZE;
  if (requested < 1) return 1;
  if (requested > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
  return Math.floor(requested);
}

/**
 * TipTap body is "empty" when it has no non-empty text content.
 * Kept exported so tests can exercise the validation directly.
 */
function isEmptyBody(body: unknown): boolean {
  if (body === undefined || body === null) return true;
  if (typeof body !== "object") return true;
  const record = body as Record<string, unknown>;
  const content = record.content;
  if (!Array.isArray(content) || content.length === 0) return true;
  return content.every((node) => isEmptyNode(node));
}

function isEmptyNode(node: unknown): boolean {
  if (typeof node !== "object" || node === null) return true;
  const record = node as Record<string, unknown>;
  if (record.type === "text") {
    const text = record.text;
    return typeof text !== "string" || text.trim().length === 0;
  }
  const content = record.content;
  if (Array.isArray(content)) {
    return content.every((child) => isEmptyNode(child));
  }
  return true;
}