import type { ArtifactId, AttachmentId, SpaceId, UserId } from "@denser/contracts";
import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { attachment } from "../../db/schema/attachment.js";

export type AttachmentRow = typeof attachment.$inferSelect;

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
