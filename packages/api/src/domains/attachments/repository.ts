import type {
  ArtifactId,
  AttachmentAnchor,
  AttachmentId,
  MessageDraftId,
  MessageId,
  ScheduledJobId,
  SpaceId,
  UserId,
} from "@denser/contracts";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/client.js";
import { attachment, messageAttachment } from "../../db/schema/attachment.js";
import { messageDraft, messageDraftAttachment } from "../../db/schema/message-draft.js";
import { scheduledJob, scheduledJobAttachment } from "../../db/schema/scheduled-job.js";
import { message } from "../../db/schema/message.js";
import type { AnchorScope } from "./rules.js";

export type AttachmentRow = typeof attachment.$inferSelect;

// --- Ticket 16: attachment metadata row CRUD (BlobStore adapters) ---

export type CreateAttachmentRowInput = {
  rootSpaceId: SpaceId;
  conversationId?: ArtifactId | null;
  uploadedBy: UserId;
  storageKey: string;
  mimeType: string;
  originalFilename: string;
  byteSize: number;
};

export async function insertAttachmentRow(input: CreateAttachmentRowInput): Promise<AttachmentRow> {
  const [created] = await db
    .insert(attachment)
    .values({
      rootSpaceId: input.rootSpaceId,
      conversationId: input.conversationId ?? null,
      uploadedBy: input.uploadedBy,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      originalFilename: input.originalFilename,
      byteSize: input.byteSize,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create attachment row");
  }

  return created;
}

export async function findAttachmentByStorageKey(
  storageKey: string,
): Promise<AttachmentRow | undefined> {
  return db.query.attachment.findFirst({
    where: eq(attachment.storageKey, storageKey),
  });
}

export async function deleteAttachmentRow(id: AttachmentId): Promise<void> {
  await db.delete(attachment).where(eq(attachment.id, id));
}

export async function deleteAttachmentRowByStorageKey(storageKey: string): Promise<void> {
  await db.delete(attachment).where(eq(attachment.storageKey, storageKey));
}

/** `hasRow` probe backed by the attachments table (orphan sweep). */
export async function attachmentHasRow(storageKey: string): Promise<boolean> {
  const row = await findAttachmentByStorageKey(storageKey);
  return row != null;
}

// --- Ticket 17: reference-graph queries (AttachmentReferences) ---

export async function resolveAnchorScope(anchor: AttachmentAnchor): Promise<AnchorScope | null> {
  switch (anchor.type) {
    case "draft": {
      const row = await db.query.messageDraft.findFirst({
        where: eq(messageDraft.id, anchor.draftId),
        columns: { rootSpaceId: true, conversationId: true },
      });
      if (!row) return null;
      return { rootSpaceId: row.rootSpaceId, conversationId: row.conversationId };
    }
    case "scheduled": {
      const row = await db.query.scheduledJob.findFirst({
        where: eq(scheduledJob.id, anchor.scheduledJobId),
        columns: { rootSpaceId: true },
      });
      if (!row) return null;
      return { rootSpaceId: row.rootSpaceId };
    }
    case "message": {
      const row = await db.query.message.findFirst({
        where: eq(message.id, anchor.messageId),
        columns: { rootSpaceId: true, conversationId: true },
      });
      if (!row) return null;
      return { rootSpaceId: row.rootSpaceId ?? "", conversationId: row.conversationId };
    }
  }
}

export async function listAnchorAttachmentIds(anchor: AttachmentAnchor): Promise<AttachmentId[]> {
  const table = joinTable(anchor);
  const rows = await db
    .select({ attachmentId: table.attachmentId })
    .from(table)
    .where(eq(anchorKeyOf(anchor), anchorIdOf(anchor)));
  return rows.map((r) => r.attachmentId);
}

export async function loadAttachments(ids: readonly AttachmentId[]): Promise<AttachmentRow[]> {
  if (ids.length === 0) return [];
  return db.select().from(attachment).where(inArray(attachment.id, ids));
}

export async function loadAttachment(
  attachmentId: AttachmentId,
): Promise<AttachmentRow | undefined> {
  const [row] = await db.select().from(attachment).where(eq(attachment.id, attachmentId)).limit(1);
  return row;
}

export async function listDeliveredForConversationAttachments(
  conversationId: ArtifactId,
): Promise<AttachmentRow[]> {
  const rows = await db
    .select({ attachment })
    .from(messageAttachment)
    .innerJoin(message, eq(message.id, messageAttachment.messageId))
    .innerJoin(attachment, eq(attachment.id, messageAttachment.attachmentId))
    .where(and(eq(message.conversationId, conversationId), isNull(message.deletedAt)));
  return rows.map((r) => r.attachment);
}

// --- helpers ---

function joinTable(anchor: AttachmentAnchor) {
  switch (anchor.type) {
    case "draft":
      return messageDraftAttachment;
    case "scheduled":
      return scheduledJobAttachment;
    case "message":
      return messageAttachment;
  }
}

/** The FK column identifying this anchor's key within its join table. */
function anchorKeyOf(anchor: AttachmentAnchor) {
  switch (anchor.type) {
    case "draft":
      return messageDraftAttachment.draftId;
    case "scheduled":
      return scheduledJobAttachment.jobId;
    case "message":
      return messageAttachment.messageId;
  }
}

function anchorIdOf(anchor: AttachmentAnchor): MessageDraftId | ScheduledJobId | MessageId {
  switch (anchor.type) {
    case "draft":
      return anchor.draftId;
    case "scheduled":
      return anchor.scheduledJobId;
    case "message":
      return anchor.messageId;
  }
}
