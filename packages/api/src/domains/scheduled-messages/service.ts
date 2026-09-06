import { randomUUID } from "node:crypto";
import type {
  ArtifactId,
  AttachmentDto,
  AttachmentId,
  ClientId,
  MessageId,
  ScheduleMessageInput,
  ScheduledJobId,
  ScheduledMessageDto,
  SpaceId,
  UpdateScheduledMessageInput,
  UserId,
} from "@denser/contracts";
import { createScheduledMessageJob } from "@denser/contracts";
import { getPort } from "../../ports/container.js";
import {
  emitScheduledMessageCancelled,
  emitScheduledMessageUpserted,
} from "../../realtime/scheduled-message-events.js";
import { deleteMessageDraft } from "../drafts/service.js";
import type { MessageService } from "../messages/service.js";
import { requireArtifactAccess } from "../tenancy/access.js";
import { createJob, registerHandler } from "../scheduling/service.js";
import { toScheduledMessageDto } from "./mapper.js";
import * as repo from "./repository.js";
import { isOnceJob } from "./recurrence.js";

function isEmptyBody(body: unknown): boolean {
  if (body == null) return true;
  if (typeof body !== "object") return false;
  const doc = body as { type?: string; content?: unknown[] };
  if (doc.type === "doc" && Array.isArray(doc.content) && doc.content.length === 0) return true;
  return false;
}


type ConversationContext = {
  rootSpaceId: SpaceId;
  kind: "conversation";
};

async function requireConversation(
  userId: UserId,
  conversationId: ArtifactId,
): Promise<ConversationContext | null> {
  const row = await requireArtifactAccess(userId, conversationId);
  if (!row || row.kind !== "conversation" || !row.rootSpaceId) return null;
  return { kind: "conversation", rootSpaceId: row.rootSpaceId };
}

async function loadScheduledAttachments(jobId: ScheduledJobId): Promise<AttachmentDto[]> {
  return getPort("attachmentReferences").load({ type: "scheduled", scheduledJobId: jobId });
}

async function syncScheduledAttachments(
  jobId: ScheduledJobId,
  attachmentIds: AttachmentId[],
  actor: UserId,
): Promise<void> {
  await getPort("attachmentReferences").commit({
    op: "sync",
    anchor: { type: "scheduled", scheduledJobId: jobId },
    attachmentIds,
    actor: { userId: actor },
  });
}

async function releaseScheduledAttachments(jobId: ScheduledJobId, actor: UserId): Promise<void> {
  await getPort("attachmentReferences").commit({
    op: "release",
    anchor: { type: "scheduled", scheduledJobId: jobId },
    actor: { userId: actor, trustedDelivery: true },
  });
}

async function present(row: repo.ScheduledMessageRow): Promise<ScheduledMessageDto> {
  const attachments = await loadScheduledAttachments(row.id);
  return toScheduledMessageDto(row, attachments);
}

export type ScheduleMessageResult =
  | { ok: true; scheduledMessage: ScheduledMessageDto }
  | { ok: false; reason: "not_found" | "invalid_message" | "invalid_thread" };

export async function scheduleMessage(
  userId: UserId,
  conversationId: ArtifactId,
  input: ScheduleMessageInput,
): Promise<ScheduleMessageResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const attachmentIds = input.attachmentIds ?? [];
  const hasBody = input.body !== undefined && !isEmptyBody(input.body);
  if (!hasBody && attachmentIds.length === 0) {
    return { ok: false as const, reason: "invalid_message" as const };
  }

  const threadId = input.threadId ?? null;
  if (threadId !== null) {
    const { messageRepository } = await import("../messages/repository.js");
    const parent = await messageRepository.findMessageById(threadId);
    if (!parent || parent.conversationId !== conversationId) {
      return { ok: false as const, reason: "invalid_thread" as const };
    }
  }

  const dueAt = input.dueAt;
  const draft = createScheduledMessageJob(
    {
      rootSpaceId: conversation.rootSpaceId,
      dueAt,
      nextRunAt: dueAt,
      timezone: null,
      recurrence: null,
    },
    {
      conversationId,
      senderId: userId,
      body: input.body,
      quotesId: input.quotesId ?? null,
      threadId,
    },
  );

  const jobId = await createJob(draft);
  await syncScheduledAttachments(jobId, attachmentIds, userId);
  await deleteMessageDraft(userId, conversationId, threadId);

  const row = await repo.findScheduledMessageJob(jobId, conversation.rootSpaceId);
  if (!row) {
    throw new Error("Scheduled message job missing after insert");
  }

  const scheduledMessage = await present(row);
  emitScheduledMessageUpserted({ conversationId, scheduledMessage });
  return { ok: true as const, scheduledMessage };
}

export type ListScheduledMessagesResult =
  | { ok: true; scheduledMessages: ScheduledMessageDto[] }
  | { ok: false; reason: "not_found" };

export async function listScheduledMessages(
  userId: UserId,
  conversationId: ArtifactId,
): Promise<ListScheduledMessagesResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const rows = await repo.listActiveScheduledMessagesForConversation(
    conversationId,
    conversation.rootSpaceId,
  );
  const scheduledMessages = await Promise.all(rows.map((row) => present(row)));
  return { ok: true as const, scheduledMessages };
}

export type GetScheduledMessageResult =
  | { ok: true; scheduledMessage: ScheduledMessageDto }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function getScheduledMessage(
  userId: UserId,
  conversationId: ArtifactId,
  jobId: ScheduledJobId,
): Promise<GetScheduledMessageResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const row = await repo.findScheduledMessageJob(jobId, conversation.rootSpaceId);
  if (!row || row.payload.conversationId !== conversationId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (row.payload.senderId !== userId) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  return { ok: true as const, scheduledMessage: await present(row) };
}

export type UpdateScheduledMessageResult =
  | { ok: true; scheduledMessage: ScheduledMessageDto }
  | { ok: false; reason: "not_found" | "forbidden" | "invalid_message" | "processed" };

export async function updateScheduledMessage(
  userId: UserId,
  conversationId: ArtifactId,
  jobId: ScheduledJobId,
  input: UpdateScheduledMessageInput,
): Promise<UpdateScheduledMessageResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const existing = await repo.findScheduledMessageJob(jobId, conversation.rootSpaceId);
  if (!existing || existing.payload.conversationId !== conversationId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (existing.payload.senderId !== userId) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  if (existing.processed) {
    return { ok: false as const, reason: "processed" as const };
  }

  const nextBody = input.body !== undefined ? input.body : existing.payload.body;
  if (input.body !== undefined && isEmptyBody(input.body) && (input.attachmentIds ?? []).length === 0) {
    const currentAttachments = await loadScheduledAttachments(jobId);
    if (currentAttachments.length === 0) {
      return { ok: false as const, reason: "invalid_message" as const };
    }
  }

  const dueAt = input.dueAt ?? existing.dueAt;
  const payload = {
    ...existing.payload,
    body: nextBody,
    ...(input.quotesId !== undefined ? { quotesId: input.quotesId } : {}),
    ...(input.threadId !== undefined ? { threadId: input.threadId } : {}),
  };

  const updated = await repo.updateScheduledMessageJob({
    jobId,
    rootSpaceId: conversation.rootSpaceId,
    payload,
    dueAt,
    nextRunAt: dueAt,
  });
  if (!updated) {
    return { ok: false as const, reason: "processed" as const };
  }

  if (input.attachmentIds !== undefined) {
    await syncScheduledAttachments(jobId, input.attachmentIds, userId);
  }

  const scheduledMessage = await present(updated);
  emitScheduledMessageUpserted({ conversationId, scheduledMessage });
  return { ok: true as const, scheduledMessage };
}

export type CancelScheduledMessageResult =
  | { ok: true; scheduledMessage: ScheduledMessageDto }
  | { ok: false; reason: "not_found" | "forbidden" };

export async function cancelScheduledMessage(
  userId: UserId,
  conversationId: ArtifactId,
  jobId: ScheduledJobId,
): Promise<CancelScheduledMessageResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const existing = await repo.findScheduledMessageJob(jobId, conversation.rootSpaceId);
  if (!existing || existing.payload.conversationId !== conversationId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (existing.payload.senderId !== userId) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  await releaseScheduledAttachments(jobId, userId);
  const cancelled = await repo.cancelScheduledMessageJob(jobId, conversation.rootSpaceId, userId);
  if (!cancelled) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const scheduledMessage = await present(cancelled);
  emitScheduledMessageCancelled({ conversationId, scheduledJobId: jobId });
  emitScheduledMessageUpserted({ conversationId, scheduledMessage });
  return { ok: true as const, scheduledMessage };
}

export function registerScheduledMessageHandler(messageService: MessageService): void {
  registerHandler("scheduled_message", async (job, _ctx) => {
    const { conversationId, senderId, body, quotesId, threadId } = job.payload;

    const access = await requireArtifactAccess(senderId, conversationId);
    if (!access || access.kind !== "conversation") {
      throw new Error("Sender lost access to conversation before scheduled delivery");
    }

    const attachments = await loadScheduledAttachments(job.id);
    const attachmentIds = attachments.map((a) => a.id);

    const result = await messageService.postMessage(senderId, {
      conversationId,
      body: body ?? undefined,
      quotesId: quotesId ?? null,
      threadId: threadId ?? null,
      clientId: randomUUID() as ClientId,
      attachmentIds,
      occurrenceKey: job.occurrenceKey,
      markAsScheduled: true,
      trustedDelivery: true,
    });

    if (!result.ok) {
      throw new Error(`Scheduled message delivery failed: ${result.reason}`);
    }

    if (isOnceJob(job)) {
      await releaseScheduledAttachments(job.id, senderId);
    }
  });
}
