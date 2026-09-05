import type {
  ArtifactId,
  AttachmentDto,
  AttachmentId,
  MessageDraftId,
  MessageId,
  StartConversationUploadInput,
  UserId,
} from "@denser/contracts";
import { getPort } from "../../ports/container.js";
import { requireArtifactAccess } from "../tenancy/access.js";
import { ensureMessageDraft } from "../drafts/service.js";

type UploadSession = {
  userId: UserId;
  conversationId: ArtifactId;
  attachmentId: AttachmentId;
  draftId: MessageDraftId;
};

const sessions = new Map<string, UploadSession>();

function requireConversation(userId: UserId, conversationId: ArtifactId) {
  return requireArtifactAccess(userId, conversationId).then((row) =>
    row && row.kind === "conversation" && row.rootSpaceId ? row : null,
  );
}

async function syncDraftAttachmentIds(
  draftId: MessageDraftId,
  userId: UserId,
  attachmentIds: AttachmentId[],
): Promise<void> {
  await getPort("attachmentReferences").commit({
    op: "sync",
    anchor: { type: "draft", draftId },
    attachmentIds,
    actor: { userId },
  });
}

async function loadDraftAttachmentIds(draftId: MessageDraftId): Promise<AttachmentId[]> {
  const loaded = await getPort("attachmentReferences").load({ type: "draft", draftId });
  return loaded.map((attachment) => attachment.id);
}

function getSession(uploadId: string, userId: UserId, conversationId: ArtifactId): UploadSession | null {
  const session = sessions.get(uploadId);
  if (!session) return null;
  if (session.userId !== userId || session.conversationId !== conversationId) return null;
  return session;
}

export type StartConversationUploadResult =
  | { ok: true; attachmentId: AttachmentId; uploadId: string; draftId: MessageDraftId }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "upload_unavailable" };

export async function startConversationUpload(
  userId: UserId,
  conversationId: ArtifactId,
  input: StartConversationUploadInput,
): Promise<StartConversationUploadResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation?.rootSpaceId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  const rootSpaceId = conversation.rootSpaceId;

  const threadId = input.threadId ?? null;
  const ensured = await ensureMessageDraft(userId, conversationId, threadId);
  if (!ensured.ok) {
    return { ok: false as const, reason: "not_found" as const };
  }

  let created: { attachmentId: AttachmentId; upload: { uploadId: string } };
  try {
    created = await getPort("blobStore").createUpload({
      rootSpaceId,
      uploadedBy: userId,
      filename: input.filename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      conversationId,
    });
  } catch {
    return { ok: false as const, reason: "upload_unavailable" as const };
  }

  const existingIds = await loadDraftAttachmentIds(ensured.draft.id);
  const attachmentIds = [...new Set([...existingIds, created.attachmentId])];
  await syncDraftAttachmentIds(ensured.draft.id, userId, attachmentIds);

  sessions.set(created.upload.uploadId, {
    userId,
    conversationId,
    attachmentId: created.attachmentId,
    draftId: ensured.draft.id,
  });

  return {
    ok: true as const,
    attachmentId: created.attachmentId,
    uploadId: created.upload.uploadId,
    draftId: ensured.draft.id,
  };
}

export type UploadConversationPartResult =
  | { ok: true }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_part" };

export async function uploadConversationPart(
  userId: UserId,
  conversationId: ArtifactId,
  uploadId: string,
  part: number,
  data: Uint8Array,
): Promise<UploadConversationPartResult> {
  const session = getSession(uploadId, userId, conversationId);
  if (!session) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (!Number.isInteger(part) || part < 1) {
    return { ok: false as const, reason: "invalid_part" as const };
  }

  const blobStore = getPort("blobStore");
  if (!blobStore.uploadPart) {
    return { ok: false as const, reason: "not_found" as const };
  }

  try {
    await blobStore.uploadPart({ uploadId, part, data });
  } catch {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const };
}

export type CompleteConversationUploadResult =
  | { ok: true; attachment: AttachmentDto }
  | { ok: false; reason: "not_found" };

export async function completeConversationUpload(
  userId: UserId,
  conversationId: ArtifactId,
  uploadId: string,
): Promise<CompleteConversationUploadResult> {
  const session = getSession(uploadId, userId, conversationId);
  if (!session) {
    return { ok: false as const, reason: "not_found" as const };
  }

  try {
    await getPort("blobStore").completeUpload(uploadId);
  } catch {
    return { ok: false as const, reason: "not_found" as const };
  }

  sessions.delete(uploadId);

  const attachments = await getPort("attachmentReferences").load({
    type: "draft",
    draftId: session.draftId,
  });
  const attachment = attachments.find((row) => row.id === session.attachmentId);
  if (!attachment) {
    return { ok: false as const, reason: "not_found" as const };
  }

  return { ok: true as const, attachment };
}

export type AbortConversationUploadResult = { ok: true } | { ok: false; reason: "not_found" };

export async function abortConversationUpload(
  userId: UserId,
  conversationId: ArtifactId,
  uploadId: string,
): Promise<AbortConversationUploadResult> {
  const session = getSession(uploadId, userId, conversationId);
  if (!session) {
    return { ok: false as const, reason: "not_found" as const };
  }

  sessions.delete(uploadId);

  try {
    await getPort("blobStore").abortUpload(uploadId);
  } catch {
    return { ok: false as const, reason: "not_found" as const };
  }

  const existingIds = await loadDraftAttachmentIds(session.draftId);
  const attachmentIds = existingIds.filter((id) => id !== session.attachmentId);
  await syncDraftAttachmentIds(session.draftId, userId, attachmentIds);

  return { ok: true as const };
}

export type ListDraftAttachmentsResult =
  | { ok: true; attachments: AttachmentDto[] }
  | { ok: false; reason: "not_found" };

/** Lists attachment metadata for the author's draft anchor (composer hydrate helper). */
export async function listDraftAttachments(
  userId: UserId,
  conversationId: ArtifactId,
  threadId: MessageId | null,
): Promise<ListDraftAttachmentsResult> {
  const conversation = await requireConversation(userId, conversationId);
  if (!conversation) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const ensured = await ensureMessageDraft(userId, conversationId, threadId);
  if (!ensured.ok) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const attachments = await getPort("attachmentReferences").load({
    type: "draft",
    draftId: ensured.draft.id,
  });
  return { ok: true as const, attachments };
}

/** Test hook: clears in-memory upload sessions between tests. */
export function resetUploadSessionsForTests(): void {
  sessions.clear();
}
