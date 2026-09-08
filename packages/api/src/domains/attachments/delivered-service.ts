import type { Actor, ArtifactId, AttachmentDto, AttachmentId, UserId } from "@denser/contracts";
import { requireArtifactAccess } from "../tenancy/access.js";
import * as repo from "./repository.js";
import { attachmentReferences } from "./service.js";

function dedupeAttachments(attachments: readonly AttachmentDto[]): AttachmentDto[] {
  const seen = new Set<string>();
  const result: AttachmentDto[] = [];
  for (const attachment of attachments) {
    if (seen.has(attachment.id)) continue;
    seen.add(attachment.id);
    result.push(attachment);
  }
  return result;
}

export async function listDeliveredAttachments(userId: UserId, conversationId: ArtifactId) {
  const access = await requireArtifactAccess(userId, conversationId);
  if (!access) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const attachments = dedupeAttachments(
    await attachmentReferences.listDeliveredForConversation(conversationId),
  );
  return { ok: true as const, attachments };
}

export async function releaseDeliveredAttachment(
  userId: UserId,
  conversationId: ArtifactId,
  attachmentId: AttachmentId,
) {
  const access = await requireArtifactAccess(userId, conversationId);
  if (!access) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const row = await repo.loadAttachment(attachmentId);
  if (!row) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const delivered = await attachmentReferences.listDeliveredForConversation(conversationId);
  const inConversation = delivered.some((attachment) => attachment.id === attachmentId);
  if (!inConversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const actor: Actor = { userId };
  await attachmentReferences.commit({ op: "releaseAttachment", attachmentId, actor });
  return { ok: true as const };
}
