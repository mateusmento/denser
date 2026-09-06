import type {
  ArtifactId,
  AttachmentDto,
  AttachmentId,
  MessageDraftDto,
  MessageId,
  UpsertMessageDraftInput,
  UserId,
} from "@denser/contracts";
import { getPort, hasPort } from "../../ports/container.js";
import { requireArtifactAccess } from "../tenancy/access.js";
import { toDraftDto } from "./mapper.js";
import { decideUpsert, nextDraftExpiry } from "./policy.js";
import * as draftRepository from "./repository.js";
import type { MessageDraftRow } from "./repository.js";

function requireConversation(userId: UserId, conversationId: ArtifactId) {
  return requireArtifactAccess(userId, conversationId).then((row) =>
    row && row.kind === "conversation" ? row : null,
  );
}

/**
 * Syncs the draft's attachments through the `AttachmentReferences` port.
 * Until ticket 17 registers a real implementation the ids are accepted without
 * persisting joins (body-only drafts); the TODO below becomes a real reconcile
 * the moment the port is live. Draft access is "can post"-gated on the
 * conversation, see CONVERSATIONS.md constraint 2.
 */
async function syncDraftAttachments(
  row: MessageDraftRow,
  attachmentIds: AttachmentId[],
): Promise<void> {
  // TODO(17): when AttachmentReferences lands, this reconciles the shared
  // reference graph + orphan GC for the `draft` anchor.
  if (!hasPort("attachmentReferences")) return;
  await getPort("attachmentReferences").commit({
    op: "sync",
    anchor: { type: "draft", draftId: row.id },
    attachmentIds,
    actor: { userId: row.authorId },
  });
}

/** Loads the draft's attachment tiles via the port; body-only until 17 lands. */
async function loadDraftAttachments(row: MessageDraftRow): Promise<AttachmentDto[]> {
  // TODO(17): drafts are body-only until AttachmentReferences.load is live.
  if (!hasPort("attachmentReferences")) return [];
  try {
    return await getPort("attachmentReferences").load({ type: "draft", draftId: row.id });
  } catch {
    return [];
  }
}

async function toMessageDraftDto(row: MessageDraftRow): Promise<MessageDraftDto> {
  return toDraftDto(row, await loadDraftAttachments(row));
}

/** Releases the draft's attachment anchor via the port, then deletes the row. */
async function releaseAndDeleteDraft(row: MessageDraftRow): Promise<void> {
  if (hasPort("attachmentReferences")) {
    try {
      await getPort("attachmentReferences").commit({
        op: "release",
        anchor: { type: "draft", draftId: row.id },
        actor: { userId: row.authorId },
      });
    } catch {
      // The row is still deleted; 17's reclaim is the orphan safety net.
    }
  }
  await draftRepository.deleteDraft(row.id);
}

export type GetMessageDraftResult =
  | { ok: true; draft: MessageDraftDto | null }
  | { ok: false; reason: "not_found" };

export type EnsureMessageDraftResult =
  | { ok: true; draft: MessageDraftRow }
  | { ok: false; reason: "not_found" };

/**
 * Ensures a draft row exists for (conversation, author, thread) without changing
 * body or version. Used by upload staging (ticket 18) before syncing attachment joins.
 */
export async function ensureMessageDraft(
  userId: UserId,
  conversationId: ArtifactId,
  threadId: MessageId | null,
): Promise<EnsureMessageDraftResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation || !conversation.rootSpaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const existing = await draftRepository.findDraftByKey({
    conversationId,
    authorId: userId,
    threadId,
  });
  if (existing) {
    return { ok: true as const, draft: existing };
  }

  try {
    const created = await draftRepository.insertDraft({
      rootSpaceId: conversation.rootSpaceId,
      conversationId,
      authorId: userId,
      threadId,
      body: null,
      quotesId: null,
      version: 1,
      expiresAt: nextDraftExpiry(),
    });
    return { ok: true as const, draft: created };
  } catch {
    const winner = await draftRepository.findDraftByKey({
      conversationId,
      authorId: userId,
      threadId,
    });
    if (!winner) {
      return { ok: false as const, reason: "not_found" as const };
    }
    return { ok: true as const, draft: winner };
  }
}

export async function getMessageDraft(
  userId: UserId,
  conversationId: ArtifactId,
  threadId: MessageId | null,
): Promise<GetMessageDraftResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const row = await draftRepository.findDraftByKey({
    conversationId,
    authorId: userId,
    threadId,
  });
  if (!row) {
    return { ok: true as const, draft: null };
  }

  return { ok: true as const, draft: await toMessageDraftDto(row) };
}

export type UpsertMessageDraftResult =
  | { ok: true; draft: MessageDraftDto; created: boolean }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict"; draft: MessageDraftDto | null };

export async function upsertMessageDraft(
  userId: UserId,
  input: UpsertMessageDraftInput,
): Promise<UpsertMessageDraftResult> {
  const conversation = await requireConversation(userId, input.conversationId);
  if (!conversation || !conversation.rootSpaceId) {
    // Drafts are workspace-tenanted; a root-artifact conversation has no tenant.
    return { ok: false as const, reason: "not_found" as const };
  }

  const threadId = input.threadId ?? null;
  const existing = await draftRepository.findDraftByKey({
    conversationId: input.conversationId,
    authorId: userId,
    threadId,
  });

  const decision = decideUpsert(existing, input.version);
  if (decision.kind === "conflict") {
    return {
      ok: false as const,
      reason: "conflict" as const,
      draft: decision.draft ? await toMessageDraftDto(decision.draft) : null,
    };
  }

  if (decision.kind === "create") {
    try {
      const created = await draftRepository.insertDraft({
        rootSpaceId: conversation.rootSpaceId,
        conversationId: input.conversationId,
        authorId: userId,
        threadId,
        body: input.body,
        quotesId: input.quotesId ?? null,
        version: input.version + 1,
        expiresAt: nextDraftExpiry(),
      });

      if (input.attachmentIds !== undefined) {
        await syncDraftAttachments(created, input.attachmentIds);
      }

      return { ok: true as const, created: true as const, draft: await toMessageDraftDto(created) };
    } catch {
      // Concurrent create for the same draft key: surface the winner as 409.
      const winner = await draftRepository.findDraftByKey({
        conversationId: input.conversationId,
        authorId: userId,
        threadId,
      });
      return {
        ok: false as const,
        reason: "conflict" as const,
        draft: winner ? await toMessageDraftDto(winner) : null,
      };
    }
  }

  if (!existing) {
    // decideUpsert only resolves "update" when a row exists; unreachable.
    return { ok: false as const, reason: "conflict" as const, draft: null };
  }

  const updated = await draftRepository.updateDraft({
    draftId: existing.id,
    expectedVersion: existing.version,
    body: input.body,
    ...(input.quotesId === undefined ? {} : { quotesId: input.quotesId }),
    expiresAt: nextDraftExpiry(),
  });

  if (!updated) {
    const fresh = await draftRepository.findDraftById(existing.id);
    return {
      ok: false as const,
      reason: "conflict" as const,
      draft: fresh ? await toMessageDraftDto(fresh) : null,
    };
  }

  if (input.attachmentIds !== undefined) {
    await syncDraftAttachments(updated, input.attachmentIds);
  }

  return { ok: true as const, created: false as const, draft: await toMessageDraftDto(updated) };
}

export type DeleteMessageDraftResult =
  | { ok: true }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict"; draft: MessageDraftDto };

/**
 * Deletes the draft for (conversation, author, thread).
 * `version` is an optional optimistic guard (HTTP DELETE); send/schedule paths
 * (tickets 02 / 25) call this without a version to clear the draft after a
 * successful post or schedule.
 */
export async function deleteMessageDraft(
  userId: UserId,
  conversationId: ArtifactId,
  threadId: MessageId | null,
  version?: number,
): Promise<DeleteMessageDraftResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const row = await draftRepository.findDraftByKey({
    conversationId,
    authorId: userId,
    threadId,
  });
  if (!row) {
    return { ok: true as const };
  }

  if (version !== undefined && version !== row.version) {
    return { ok: false as const, reason: "conflict" as const, draft: await toMessageDraftDto(row) };
  }

  await releaseAndDeleteDraft(row);
  return { ok: true as const };
}

/**
 * TTL purge job body: releases the attachment anchor (via port) for each
 * expired draft, then deletes the row. Schedulers (ticket 24) can run this on
 * an interval; returns the number of purged drafts.
 */
export async function purgeExpiredDrafts(now = new Date(), limit = 500): Promise<number> {
  const expired = await draftRepository.listExpiredDrafts(now, limit);
  for (const row of expired) {
    await releaseAndDeleteDraft(row);
  }
  return expired.length;
}