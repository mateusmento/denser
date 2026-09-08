import type { AttachmentId, UserId } from "@denser/contracts";
import { getPort } from "../../ports/index.js";
import { requireArtifactAccess } from "../tenancy/access.js";
import { loadAttachment, listDeliveredForConversationAttachments } from "./repository.js";

export async function readAttachmentContent(userId: UserId, attachmentId: AttachmentId) {
  const row = await loadAttachment(attachmentId);
  if (!row?.conversationId) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const access = await requireArtifactAccess(userId, row.conversationId);
  if (!access) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const canRead =
    row.uploadedBy === userId ||
    (await listDeliveredForConversationAttachments(row.conversationId)).some(
      (attachment) => attachment.id === attachmentId,
    );

  if (!canRead) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const blobStore = getPort("blobStore");
  if (!blobStore.readObject) {
    return { ok: false as const, reason: "unavailable" as const };
  }

  const bytes = await blobStore.readObject(row.storageKey);
  return {
    ok: true as const,
    bytes,
    mimeType: row.mimeType,
    filename: row.originalFilename,
  };
}
