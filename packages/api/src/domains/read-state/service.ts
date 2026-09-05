import type {
  ArtifactId,
  ConversationReadStateDto,
  MessageId,
  SpaceId,
  UnreadConversationSummary,
  UserId,
} from "@denser/contracts";
import { requireArtifactAccess, requireSpaceAccess } from "../tenancy/access.js";
import * as readStateRepository from "./repository.js";

function toDto(row: readStateRepository.ReadStateRow): ConversationReadStateDto {
  return {
    conversationId: row.conversationId,
    userId: row.userId,
    lastReadAt: row.lastReadAt.toISOString(),
  };
}

export async function markConversationRead(
  userId: UserId,
  conversationId: ArtifactId,
  messageId?: MessageId,
) {
  const artifact = await requireArtifactAccess(userId, conversationId);
  if (!artifact) {
    return { ok: false as const, reason: "not_found" as const };
  }

  let lastReadAt: Date;
  if (messageId) {
    const messageAt = await readStateRepository.findMessageCreatedAt(messageId);
    if (!messageAt) {
      return { ok: false as const, reason: "invalid_message" as const };
    }
    lastReadAt = messageAt;
  } else {
    lastReadAt =
      (await readStateRepository.findLatestMessageCreatedAt(conversationId)) ?? new Date();
  }

  const row = await readStateRepository.upsertReadState({
    conversationId,
    userId,
    lastReadAt,
  });

  return { ok: true as const, readState: toDto(row) };
}

export async function getUnreadSummary(userId: UserId, rootSpaceId: SpaceId) {
  const space = await requireSpaceAccess(userId, rootSpaceId);
  if (!space) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const candidateIds = await readStateRepository.listAccessibleConversationIds(
    userId,
    rootSpaceId,
  );

  const conversations: UnreadConversationSummary[] = [];

  for (const conversationId of candidateIds) {
    const artifact = await requireArtifactAccess(userId, conversationId);
    if (!artifact) continue;

    const readRow = await readStateRepository.findReadState(conversationId, userId);
    const lastReadAt = readRow?.lastReadAt ?? null;
    const unreadCount = await readStateRepository.countUnreadMessages(
      conversationId,
      userId,
      lastReadAt,
    );

    if (unreadCount === 0) continue;

    const firstUnreadMessageId = await readStateRepository.findFirstUnreadMessageId(
      conversationId,
      userId,
      lastReadAt,
    );

    conversations.push({
      conversationId,
      unreadCount,
      firstUnreadMessageId,
    });
  }

  return { ok: true as const, conversations };
}

export async function getConversationUnread(
  userId: UserId,
  conversationId: ArtifactId,
) {
  const artifact = await requireArtifactAccess(userId, conversationId);
  if (!artifact) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const readRow = await readStateRepository.findReadState(conversationId, userId);
  const lastReadAt = readRow?.lastReadAt ?? null;
  const unreadCount = await readStateRepository.countUnreadMessages(
    conversationId,
    userId,
    lastReadAt,
  );
  const firstUnreadMessageId = await readStateRepository.findFirstUnreadMessageId(
    conversationId,
    userId,
    lastReadAt,
  );

  return {
    ok: true as const,
    summary: {
      conversationId,
      unreadCount,
      firstUnreadMessageId,
    } satisfies UnreadConversationSummary,
  };
}
