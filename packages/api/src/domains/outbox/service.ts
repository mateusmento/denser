import type {
  DraftOutboxItemDto,
  ScheduledOutboxItemDto,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { getPort, hasPort } from "../../ports/container.js";
import * as draftRepository from "../drafts/repository.js";
import type { MessageDraftRow } from "../drafts/repository.js";
import * as scheduledRepository from "../scheduled-messages/repository.js";
import { requireSpaceAccess } from "../tenancy/access.js";
import {
  FALLBACK_CONVERSATION_LABEL,
  outboxContextLabel,
  resolveConversationLabel,
} from "./enrichment.js";

function isEmptyBody(body: unknown): boolean {
  if (body == null) return true;
  if (typeof body !== "object") return false;
  const doc = body as { type?: string; content?: unknown[] };
  if (doc.type === "doc" && Array.isArray(doc.content) && doc.content.length === 0) return true;
  return false;
}

async function draftHasAttachments(row: MessageDraftRow): Promise<boolean> {
  if (!hasPort("attachmentReferences")) return false;
  try {
    const attachments = await getPort("attachmentReferences").load({
      type: "draft",
      draftId: row.id,
    });
    return attachments.length > 0;
  } catch {
    return false;
  }
}

async function isNonEmptyDraft(row: MessageDraftRow): Promise<boolean> {
  if (!isEmptyBody(row.body)) return true;
  return draftHasAttachments(row);
}

async function toDraftOutboxItem(
  userId: UserId,
  row: MessageDraftRow,
): Promise<DraftOutboxItemDto> {
  const conversationLabel = await resolveConversationLabel(userId, row.conversationId);
  return {
    id: row.id,
    conversationId: row.conversationId,
    threadId: row.threadId,
    conversationLabel: conversationLabel ?? FALLBACK_CONVERSATION_LABEL,
    contextLabel: outboxContextLabel(row.threadId),
    body: row.body ?? null,
    expiresAt: row.expiresAt.toISOString(),
  };
}

async function toScheduledOutboxItem(
  userId: UserId,
  row: Awaited<ReturnType<typeof scheduledRepository.listActiveScheduledMessagesForUser>>[number],
): Promise<ScheduledOutboxItemDto> {
  const conversationLabel = await resolveConversationLabel(userId, row.payload.conversationId);
  return {
    jobId: row.id,
    conversationId: row.payload.conversationId,
    threadId: row.payload.threadId ?? null,
    conversationLabel: conversationLabel ?? FALLBACK_CONVERSATION_LABEL,
    contextLabel: outboxContextLabel(row.payload.threadId),
    body: row.payload.body ?? null,
    dueAt: row.dueAt,
    nextRunAt: row.nextRunAt,
    timezone: row.timezone ?? null,
    recurrence: row.recurrence ?? null,
  };
}

export async function listDraftsForUser(userId: UserId, rootSpaceId: SpaceId) {
  const space = await requireSpaceAccess(userId, rootSpaceId);
  if (!space) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await draftRepository.listDraftsForUser(rootSpaceId, userId, new Date());
  const nonEmpty = [];
  for (const row of rows) {
    if (await isNonEmptyDraft(row)) {
      nonEmpty.push(row);
    }
  }

  const drafts = await Promise.all(nonEmpty.map((row) => toDraftOutboxItem(userId, row)));
  return { ok: true as const, drafts };
}

export async function countDraftsForUser(userId: UserId, rootSpaceId: SpaceId) {
  const listed = await listDraftsForUser(userId, rootSpaceId);
  if (!listed.ok) {
    return listed;
  }
  return { ok: true as const, count: listed.drafts.length };
}

export async function listScheduledMessagesForUser(userId: UserId, rootSpaceId: SpaceId) {
  const space = await requireSpaceAccess(userId, rootSpaceId);
  if (!space) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await scheduledRepository.listActiveScheduledMessagesForUser(rootSpaceId, userId);
  const scheduledMessages = await Promise.all(rows.map((row) => toScheduledOutboxItem(userId, row)));
  return { ok: true as const, scheduledMessages };
}

export async function countScheduledMessagesForUser(userId: UserId, rootSpaceId: SpaceId) {
  const space = await requireSpaceAccess(userId, rootSpaceId);
  if (!space) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const count = await scheduledRepository.countActiveScheduledMessagesForUser(rootSpaceId, userId);
  return { ok: true as const, count };
}

export async function countDraftsForConversation(
  userId: UserId,
  conversationId: string,
  rootSpaceId: SpaceId,
) {
  const rows = await draftRepository.listDraftsForUser(rootSpaceId, userId, new Date());
  let count = 0;
  for (const row of rows) {
    if (row.conversationId !== conversationId) continue;
    if (await isNonEmptyDraft(row)) count += 1;
  }
  return count;
}

export async function countScheduledMessagesForConversation(
  userId: UserId,
  conversationId: string,
  rootSpaceId: SpaceId,
) {
  const rows = await scheduledRepository.listActiveScheduledMessagesForConversation(
    conversationId,
    rootSpaceId,
    userId,
  );
  return rows.length;
}
